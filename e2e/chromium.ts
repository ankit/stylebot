import { chromium, type BrowserContext } from '@playwright/test';
import type {
  Engine,
  Extension,
  ExtensionFunction,
  LaunchOptions,
} from './engine';

// Set by scripts/e2e.mjs (`yarn e2e --edge`). Edge uses the same dist/ build as Chrome.
const CHANNEL = process.env.STYLEBOT_BROWSER === 'edge' ? 'msedge' : 'chrome';

// Backed by the MV3 service worker that CDP's Extensions.loadUnpacked started.
class ChromiumExtension implements Extension {
  constructor(private readonly context: BrowserContext, readonly id: string) {}

  isRunning(): boolean {
    return this.context.serviceWorkers().length > 0;
  }

  async evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    const worker =
      this.context.serviceWorkers()[0] ??
      (await this.context.waitForEvent('serviceworker'));
    return worker.evaluate(fn as (arg: A) => R, arg as A);
  }

  close(): void {}
}

export class ChromiumEngine implements Engine {
  readonly distDir = 'dist';

  launch(userDataDir: string, options: LaunchOptions): Promise<BrowserContext> {
    // Chrome 137+ removed --load-extension; CDP's Extensions domain replaces it
    // in loadExtension below.
    return chromium.launchPersistentContext(userDataDir, {
      ...options,
      channel: CHANNEL,
      chromiumSandbox: true,
      ignoreDefaultArgs: [
        // Playwright disables extensions by default, which would block our CDP-loaded one.
        '--disable-extensions',
        '--enable-automation',
      ],
      args: [
        // Required for Extensions.loadUnpacked.
        '--enable-unsafe-extension-debugging',
        // Trims memory per worker — several of these run concurrently on CI.
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  async loadExtension(
    context: BrowserContext,
    distPath: string
  ): Promise<Extension> {
    const cdp = await context.browser()!.newBrowserCDPSession();
    const { id } = await cdp.send('Extensions.loadUnpacked', {
      path: distPath,
    });
    return new ChromiumExtension(context, id);
  }
}
