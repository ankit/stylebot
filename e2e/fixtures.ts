import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIST_PATH = path.resolve(__dirname, '..', 'dist');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  openPopup: () => Promise<Page>;
}>({
  context: async ({}, use, testInfo) => {
    if (!fs.existsSync(DIST_PATH)) {
      throw new Error(
        `No build found at ${DIST_PATH} — run \`yarn build\` before the e2e suite (\`yarn test:e2e\` does this for you).`
      );
    }

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-e2e-'));

    // --headed/--debug don't reach our manual browser launch, but they do flip this.
    const headless = testInfo.project.use.headless ?? true;

    // Chrome 137+ removed --load-extension; CDP's Extensions domain replaces it below.
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless,
      channel: 'chrome',
      chromiumSandbox: true,
      viewport: null,
      // null leaves prefers-color-scheme unemulated, matching the real OS setting.
      colorScheme: null,
      ignoreDefaultArgs: [
        // Playwright disables extensions by default, which would block our CDP-loaded one.
        '--disable-extensions',
        '--enable-automation',
      ],
      args: [
        // Required for Extensions.loadUnpacked.
        '--enable-unsafe-extension-debugging',
      ],
    });

    // The extension opens this on fresh install, stealing tab focus.
    const closeHelpTab = (p: Page) => {
      if (/^https:\/\/stylebot\.dev\/help/.test(p.url())) {
        p.close().catch(() => {});
      }
    };
    context.on('page', p => {
      closeHelpTab(p);
      p.once('framenavigated', () => closeHelpTab(p));
    });

    // Our custom context bypasses Playwright's default trace/video wiring, so start it manually.
    await context.tracing.start({ screenshots: true, snapshots: true });

    await use(context);

    const tracePath = testInfo.outputPath('trace.zip');
    await context.tracing.stop({ path: tracePath });
    // Named 'trace' so the HTML reporter shows its built-in "View trace" button.
    await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ context }, use) => {
    const cdp = await context.browser()!.newBrowserCDPSession();
    const { id } = await cdp.send('Extensions.loadUnpacked', { path: DIST_PATH });

    await use(id);
  },

  // Opens the popup by URL (Playwright can't click a real toolbar icon), in the
  // background so it doesn't steal "current tab" from the page under test.
  openPopup: async ({ context, extensionId }, use) => {
    const cdp = await context.browser()!.newBrowserCDPSession();

    const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;

    const open = async (): Promise<Page> => {
      // Filtered so the onInstalled help tab can't win this race instead.
      const pagePromise = context.waitForEvent('page', p => p.url() === popupUrl);
      await cdp.send('Target.createTarget', { url: popupUrl, background: true });
      return pagePromise;
    };

    await use(open);
  },
});

export const expect = test.expect;
