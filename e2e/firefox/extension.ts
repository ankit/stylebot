import type { Extension, ExtensionFunction } from '../engine';
import { FirefoxRdpClient } from './rdp-client';

type TargetForm = { actor: string; url: string; consoleActor: string };

type EvaluationResult = {
  resultID: string;
  hasException?: boolean;
  exceptionMessage?: string;
  result?: unknown;
};

type Addon = { id: string; actor: string; manifestURL: string };

/**
 * A temporarily installed extension plus a console into its background page,
 * which is the Firefox stand-in for Chromium's `context.serviceWorkers()[0].evaluate()`.
 */
export class FirefoxExtension implements Extension {
  private background: TargetForm | null = null;
  // Armed before each evaluateJSAsync is sent: its result can land in the same TCP
  // chunk as the request's ack, i.e. before the caller has resumed.
  private onResult: ((result: EvaluationResult) => void) | null = null;

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

    let onBackground!: () => void;
    const backgroundReady = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `Extension ${addon.id} installed but its background page never appeared.`
            )
          ),
        10_000
      );
      onBackground = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    // Target lifecycle events come from the watcher; the background page is one
    // "frame" target among the descriptor's (the other is DevTools' fallback page).
    client.onEvent('target-available-form', packet => {
      const target = packet.target as TargetForm;
      if (target.url.includes('_generated_background_page')) {
        extension.background = target;
        onBackground();
      }
    });
    client.onEvent('target-destroyed-form', packet => {
      const target = packet.target as TargetForm;
      if (extension.background?.actor === target.actor) {
        extension.background = null;
      }
    });
    client.onEvent('evaluationResult', packet => {
      extension.onResult?.(packet as unknown as EvaluationResult);
    });

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

  isRunning(): boolean {
    return this.background !== null;
  }

  /**
   * Runs `fn(arg)` inside the extension's background page and returns its
   * (JSON-serializable) result, mirroring Playwright's `worker.evaluate(fn, arg)`.
   */
  async evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    if (!this.background) {
      throw new Error(
        'The extension background page is not running — it was terminated or never started.'
      );
    }

    // The console actor returns objects as remote grips, not values, so the
    // evaluated code serializes the result itself. `mapped.await` makes the actor
    // wait for the async IIFE's promise like DevTools does for top-level await.
    const text = `(async () => JSON.stringify(await (${fn.toString()})(${JSON.stringify(
      arg ?? null
    )})))()`;

    const resultPromise = new Promise<EvaluationResult>(resolve => {
      this.onResult = resolve;
    });
    await this.client.request({
      to: this.background.consoleActor,
      type: 'evaluateJSAsync',
      text,
      mapped: { await: true },
    });
    const result = await resultPromise;
    this.onResult = null;

    if (result.hasException) {
      throw new Error(result.exceptionMessage);
    }

    return typeof result.result === 'string'
      ? JSON.parse(result.result)
      : (undefined as R);
  }

  close(): void {
    this.client.close();
  }
}
