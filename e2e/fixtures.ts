import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const DIST_PATH = path.resolve(__dirname, '..', 'dist');

// --ui mode force-manages tracing (a live `use.trace` flag) on every context,
// including ours — fighting it for control throws, so skip ours when detected.
function isLiveTraceMode(use: { trace?: unknown }): boolean {
  return (
    typeof use.trace === 'object' &&
    use.trace !== null &&
    (use.trace as { live?: boolean }).live === true
  );
}

// Tracing is a debugging aid only, never a functional requirement — best-effort
// on top of the skip above, for other external trace modes it doesn't catch.
async function safeTracing(op: () => Promise<unknown>): Promise<boolean> {
  try {
    await op();
    return true;
  } catch {
    // Ignored — see comment above.
    return false;
  }
}

// The extension's browser now outlives each test (see the worker-scoped `sharedContext`
// fixture below), so it can keep a local test server's connection open in its keep-alive
// pool — plain server.close() then hangs until that connection times out. Use this in
// afterAll instead.
export async function closeServer(server: http.Server): Promise<void> {
  const closed = new Promise<void>(resolve => server.close(() => resolve()));
  server.closeAllConnections();
  await closed;
}

export const test = base.extend<
  {
    // Overrides Playwright's built-in test-scoped `context` fixture: it wraps the
    // worker-scoped `sharedContext` below with per-test trace/tab/storage isolation.
    context: BrowserContext;
    openPopup: () => Promise<Page>;
  },
  {
    sharedContext: BrowserContext;
    extensionId: string;
  }
>({
  // Worker-scoped: one browser + one extension load per worker, reused across
  // every test file that worker runs, instead of relaunching Chrome per test.
  sharedContext: [
    async ({}, use, workerInfo) => {
      if (!fs.existsSync(DIST_PATH)) {
        throw new Error(
          `No build found at ${DIST_PATH} — run \`yarn build\` before the e2e suite (\`yarn test:e2e\` does this for you).`
        );
      }

      const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-e2e-'));

      // --headed/--debug don't reach our manual browser launch, but they do flip this.
      const headless = workerInfo.project.use.headless ?? true;

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

      // Our custom context bypasses Playwright's default trace/video wiring, so start it
      // manually; isolatePage below saves one chunk per test via startChunk/stopChunk.
      const liveTraceMode = isLiveTraceMode(workerInfo.project.use);
      if (!liveTraceMode) {
        await safeTracing(() => context.tracing.start({ screenshots: true, snapshots: true }));
      }

      await use(context);

      if (!liveTraceMode) {
        await safeTracing(() => context.tracing.stop());
      }
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ sharedContext }, use) => {
      const cdp = await sharedContext.browser()!.newBrowserCDPSession();
      const { id } = await cdp.send('Extensions.loadUnpacked', { path: DIST_PATH });

      await use(id);
    },
    { scope: 'worker' },
  ],

  // Test-scoped wrapper around the shared worker context: saves a per-test trace
  // chunk and resets tabs/storage after so state can't leak into the next test.
  context: async ({ sharedContext }, use, testInfo) => {
    const liveTraceMode = isLiveTraceMode(testInfo.project.use);

    if (!liveTraceMode) {
      await safeTracing(() => sharedContext.tracing.startChunk());
    }

    const pagesBefore = new Set(sharedContext.pages());

    await use(sharedContext);

    // Retain-on-failure: saving screenshots/snapshots for every passing test doesn't
    // scale as the suite grows, so only keep the trace when there's something to debug.
    if (!liveTraceMode) {
      if (testInfo.status !== testInfo.expectedStatus) {
        const tracePath = testInfo.outputPath('trace.zip');
        const saved = await safeTracing(() => sharedContext.tracing.stopChunk({ path: tracePath }));
        if (saved) {
          // Named 'trace' so the HTML reporter shows its built-in "View trace" button.
          await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
        }
      } else {
        await safeTracing(() => sharedContext.tracing.stopChunk());
      }
    }

    await Promise.all(
      sharedContext
        .pages()
        .filter(p => !pagesBefore.has(p))
        .map(p => p.close().catch(() => {}))
    );
    await sharedContext.clearCookies();

    const worker = sharedContext.serviceWorkers()[0];
    if (worker) {
      await worker.evaluate(() => chrome.storage.local.clear());
    }
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
