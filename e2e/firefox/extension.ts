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
  private targetWaiters: Array<TargetWaiter> = [];
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
    const { addons } = await client.request<{ addons: Array<Addon> }>({
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
    // The console actor returns objects as remote grips, not values, and reports
    // neither throws nor rejections inside the async IIFE, so the evaluated code
    // serializes the outcome itself. `mapped.await` makes the actor wait for the
    // IIFE's promise like DevTools does for top-level await.
    const text = `(async () => {
      try {
        return JSON.stringify({ value: await (${fn.toString()})(${JSON.stringify(
      arg ?? null
    )}) });
      } catch (error) {
        return JSON.stringify({ error: String(error) });
      }
    })()`;

    const result = await this.evaluateText(target.consoleActor, text);

    if (typeof result !== 'string') {
      return undefined as R;
    }

    const outcome = JSON.parse(result) as { value?: R; error?: string };
    if (outcome.error !== undefined) {
      throw new Error(outcome.error);
    }
    return outcome.value as R;
  }

  /**
   * Fires a shortcut's command where Firefox's own key handler does, in the
   * parent process. Like a real press, it goes to the focused window's tab.
   */
  async pressShortcut(
    command: string,
    tabUrl: string,
    times = 1
  ): Promise<void> {
    const consoleActor = await this.parentConsoleActor();
    const result = await this.evaluateText(
      consoleActor,
      `(() => {
        const win = Services.wm.getMostRecentWindow('navigator:browser');
        const url = win.gBrowser.selectedBrowser.currentURI.spec;
        if (!url.startsWith(${JSON.stringify(tabUrl)})) {
          return 'The focused tab is ' + url;
        }
        const { shortcuts } = WebExtensionPolicy.getByHostname(${JSON.stringify(
          this.id
        )}).extension;
        for (let i = 0; i < ${times}; i++) {
          shortcuts.onCommand(${JSON.stringify(command)});
        }
        return '';
      })()`
    );

    if (result) {
      throw new Error(`Can't press ${command} on ${tabUrl}: ${result}`);
    }
  }

  /**
   * The extension pages open right now, so a caller can tell a page it is
   * about to open apart from an earlier one at the same URL.
   */
  openTargetActors(): Set<string> {
    return new Set(this.targets.keys());
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

  private async evaluateText(
    consoleActor: string,
    text: string
  ): Promise<unknown> {
    const { resultID } = await this.client.request<{ resultID: string }>({
      to: consoleActor,
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
    return result.result;
  }

  /**
   * The console of the parent process, where Firefox handles shortcuts.
   */
  private async parentConsoleActor(): Promise<string> {
    const { processDescriptor } = await this.client.request<{
      processDescriptor: { actor: string };
    }>({ to: 'root', type: 'getProcess', id: 0 });
    const { process } = await this.client.request<{ process: TargetForm }>({
      to: processDescriptor.actor,
      type: 'getTarget',
    });
    return process.consoleActor;
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
