import type { Extension, ExtensionFunction } from '../engine';
import { FirefoxRdpClient } from './rdp-client';

export type TargetForm = { actor: string; url: string; consoleActor: string };

type EvaluationResult = {
  resultID: string;
  hasException?: boolean;
  exceptionMessage?: string;
  result?: unknown;
};

type Addon = { id: string; actor: string; manifestURL: string };

type TargetWaiter = {
  matches: (target: TargetForm) => boolean;
  resolve: (target: TargetForm) => void;
};

const BACKGROUND_URL_MARKER = '_generated_background_page';

/**
 * A temporarily installed extension plus DevTools consoles into its pages: the
 * background page (the Firefox stand-in for Chromium's service worker) and any
 * extension page open in a tab, such as the popup.
 */
export class FirefoxExtension implements Extension {
  // Every live extension page, keyed by target actor.
  private readonly targets = new Map<string, TargetForm>();
  private targetWaiters: TargetWaiter[] = [];
  // An evaluation's result can land in the same TCP chunk as the request's ack,
  // i.e. before the caller knows its resultID — so unclaimed results are parked.
  private readonly results = new Map<string, EvaluationResult>();
  private readonly resultWaiters = new Map<
    string,
    (result: EvaluationResult) => void
  >();

  private constructor(
    private readonly client: FirefoxRdpClient,
    readonly id: string
  ) {}

  static async load(
    port: number,
    addonPath: string
  ): Promise<FirefoxExtension> {
    const client = await FirefoxRdpClient.connect(port);

    const root = await client.request<{ addonsActor: string }>({
      to: 'root',
      type: 'getRoot',
    });
    const installed = await client.request<{ addon: { id: string } }>({
      to: root.addonsActor,
      type: 'installTemporaryAddon',
      addonPath,
    });
    const { addons } = await client.request<{ addons: Addon[] }>({
      to: 'root',
      type: 'listAddons',
    });
    const addon = addons.find(a => a.id === installed.addon.id)!;

    const extension = new FirefoxExtension(
      client,
      new URL(addon.manifestURL).host
    );

    client.onEvent('target-available-form', packet => {
      extension.onTargetAvailable(packet.target as TargetForm);
    });
    client.onEvent('target-destroyed-form', packet => {
      extension.targets.delete((packet.target as TargetForm).actor);
    });
    client.onEvent('evaluationResult', packet => {
      extension.onEvaluationResult(packet as unknown as EvaluationResult);
    });

    // The watcher reports every "frame" target of the descriptor — the background
    // page, DevTools' own fallback page, and any extension page open in a tab.
    const backgroundReady = extension.waitForTarget(
      target => target.url.includes(BACKGROUND_URL_MARKER),
      `Extension ${addon.id} installed but its background page never appeared.`
    );
    const watcher = await client.request<{ actor: string }>({
      to: addon.actor,
      type: 'getWatcher',
      isServerTargetSwitchingEnabled: true,
    });
    await client.request({
      to: watcher.actor,
      type: 'watchTargets',
      targetType: 'frame',
    });
    await backgroundReady;

    return extension;
  }

  private get background(): TargetForm | undefined {
    return [...this.targets.values()].find(target =>
      target.url.includes(BACKGROUND_URL_MARKER)
    );
  }

  isRunning(): boolean {
    return this.background !== undefined;
  }

  /**
   * Runs `fn(arg)` inside the extension's background page.
   */
  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    const { background } = this;
    if (!background) {
      throw new Error(
        'The extension background page is not running — it was terminated or never started.'
      );
    }
    return this.evaluateIn(background, fn, arg);
  }

  /**
   * Runs `fn(arg)` inside the given extension page and returns its
   * (JSON-serializable) result, mirroring Playwright's `page.evaluate(fn, arg)`.
   */
  async evaluateIn<A, R>(
    target: TargetForm,
    fn: ExtensionFunction<A, R>,
    arg?: A
  ): Promise<R> {
    // The console actor returns objects as remote grips, not values, so the
    // evaluated code serializes the result itself. `mapped.await` makes the actor
    // wait for the async IIFE's promise like DevTools does for top-level await.
    const text = `(async () => JSON.stringify(await (${fn.toString()})(${JSON.stringify(
      arg ?? null
    )})))()`;

    const { resultID } = await this.client.request<{ resultID: string }>({
      to: target.consoleActor,
      type: 'evaluateJSAsync',
      text,
      mapped: { await: true },
    });

    const result =
      this.results.get(resultID) ??
      (await new Promise<EvaluationResult>(resolve =>
        this.resultWaiters.set(resultID, resolve)
      ));
    this.results.delete(resultID);

    if (result.hasException) {
      throw new Error(result.exceptionMessage);
    }

    return typeof result.result === 'string'
      ? JSON.parse(result.result)
      : (undefined as R);
  }

  /**
   * Resolves with the first live extension page matching `matches`, whether it
   * already exists or appears later.
   */
  waitForTarget(
    matches: (target: TargetForm) => boolean,
    timeoutMessage: string,
    timeoutMs = 10_000
  ): Promise<TargetForm> {
    const existing = [...this.targets.values()].find(matches);
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.targetWaiters = this.targetWaiters.filter(w => w !== waiter);
        reject(new Error(timeoutMessage));
      }, timeoutMs);
      const waiter: TargetWaiter = {
        matches,
        resolve: target => {
          clearTimeout(timer);
          resolve(target);
        },
      };
      this.targetWaiters.push(waiter);
    });
  }

  close(): void {
    this.client.close();
  }

  private onTargetAvailable(target: TargetForm): void {
    this.targets.set(target.actor, target);

    const matched = this.targetWaiters.filter(w => w.matches(target));
    this.targetWaiters = this.targetWaiters.filter(w => !matched.includes(w));
    matched.forEach(waiter => waiter.resolve(target));
  }

  private onEvaluationResult(result: EvaluationResult): void {
    const waiter = this.resultWaiters.get(result.resultID);
    if (waiter) {
      this.resultWaiters.delete(result.resultID);
      waiter(result);
    } else {
      this.results.set(result.resultID, result);
    }
  }
}
