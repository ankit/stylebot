import { chromium, type BrowserContext, type Page } from '@playwright/test';
import type { Engine, Extension, LaunchOptions } from '../engine';
import { ChromiumExtension } from './extension';

// Set by scripts/e2e.mjs (`yarn e2e --edge`). Edge uses the same dist/ build as Chrome.
const CHANNEL = process.env.STYLEBOT_BROWSER === 'edge' ? 'msedge' : 'chrome';

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

  // Playwright can't click a real toolbar icon, so the popup is opened by URL.
  async openPopup(
    context: BrowserContext,
    extension: Extension
  ): Promise<Page> {
    const popupUrl = `chrome-extension://${extension.id}/popup/index.html`;

    // Filtered so the onInstalled help tab can't win this race instead.
    const pagePromise = context.waitForEvent('page', p => p.url() === popupUrl);
    const cdp = await context.browser()!.newBrowserCDPSession();
    await cdp.send('Target.createTarget', { url: popupUrl, background: true });
    return pagePromise;
  }
}
