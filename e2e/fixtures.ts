import { test as base, chromium, type BrowserContext, type Page, type TestInfo, type WorkerInfo } from '@playwright/test';
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

// The extension's browser now outlives each test (see the worker-scoped `browserPool`
// fixture below), so it can keep a local test server's connection open in its keep-alive
// pool — plain server.close() then hangs until that connection times out. Use this in
// afterAll instead.
export async function closeServer(server: http.Server): Promise<void> {
  const closed = new Promise<void>(resolve => server.close(() => resolve()));
  server.closeAllConnections();
  await closed;
}

type Instance = { context: BrowserContext; userDataDir: string; extensionId: string };

// One browser+extension instance per worker, reused across every test file that worker
// runs — get() relaunches it on demand if the shared Chrome process died mid-suite.
class BrowserPool {
  private current: Instance | null = null;
  private launching: Promise<Instance> | null = null;
  private readonly instances: Instance[] = [];

  constructor(
    private readonly workerInfo: WorkerInfo,
    private readonly liveTraceMode: boolean
  ) {}

  async get(): Promise<Instance> {
    if (this.current?.context.browser()?.isConnected()) {
      return this.current;
    }

    // Concurrent fixtures (context, extensionId) can both notice a dead browser in
    // the same tick — share one relaunch instead of racing two.
    this.launching ??= this.launch().then(instance => {
      this.current = instance;
      this.launching = null;
      return instance;
    });

    return this.launching;
  }

  private async launch(): Promise<Instance> {
    if (!fs.existsSync(DIST_PATH)) {
      throw new Error(
        `No build found at ${DIST_PATH} — run \`yarn build\` before the e2e suite (\`yarn test:e2e\` does this for you).`
      );
    }

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-e2e-'));

    // --headed/--debug don't reach our manual browser launch, but they do flip this.
    const headless = this.workerInfo.project.use.headless ?? true;

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
        // Trims memory per worker — several of these run concurrently on CI.
        '--disable-dev-shm-usage',
        '--disable-gpu',
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
    // manually; the context fixture below saves one chunk per test via startChunk/stopChunk.
    // Screenshots are the expensive part of continuous per-worker tracing; DOM
    // snapshots alone are cheap and still enough to debug a failure from.
    if (!this.liveTraceMode) {
      await safeTracing(() => context.tracing.start({ screenshots: false, snapshots: true }));
    }

    const cdp = await context.browser()!.newBrowserCDPSession();
    const { id: extensionId } = await cdp.send('Extensions.loadUnpacked', { path: DIST_PATH });

    const instance: Instance = { context, userDataDir, extensionId };
    this.instances.push(instance);
    return instance;
  }

  // Tears down every instance this worker ever launched, not just the current one —
  // a mid-suite relaunch leaves earlier instances orphaned otherwise.
  async closeAll(): Promise<void> {
    await Promise.all(
      this.instances.map(async ({ context, userDataDir }) => {
        if (context.browser()?.isConnected()) {
          if (!this.liveTraceMode) {
            await safeTracing(() => context.tracing.stop());
          }
          await context.close().catch(() => {});
        }
        fs.rmSync(userDataDir, { recursive: true, force: true });
      })
    );
  }
}

export const test = base.extend<
  {
    // Overrides Playwright's built-in test-scoped `context` fixture: it wraps the
    // worker-scoped browser pool's current context with per-test trace/tab/storage isolation.
    context: BrowserContext;
    extensionId: string;
    openPopup: () => Promise<Page>;
  },
  {
    browserPool: BrowserPool;
  }
>({
  browserPool: [
    async ({}, use, workerInfo) => {
      const pool = new BrowserPool(workerInfo, isLiveTraceMode(workerInfo.project.use));
      await use(pool);
      await pool.closeAll();
    },
    { scope: 'worker' },
  ],

  // Test-scoped so it always matches whatever context the same test's `context`
  // fixture resolved to, including right after a mid-suite relaunch.
  extensionId: async ({ browserPool }, use) => {
    const { extensionId } = await browserPool.get();
    await use(extensionId);
  },

  // Saves a per-test trace chunk and resets tabs/storage after so state can't leak
  // into the next test.
  context: async ({ browserPool }, use, testInfo: TestInfo) => {
    const { context } = await browserPool.get();
    const liveTraceMode = isLiveTraceMode(testInfo.project.use);

    if (!liveTraceMode) {
      await safeTracing(() => context.tracing.startChunk());
    }

    const pagesBefore = new Set(context.pages());

    await use(context);

    // Retain-on-failure: saving screenshots/snapshots for every passing test doesn't
    // scale as the suite grows, so only keep the trace when there's something to debug.
    if (!liveTraceMode) {
      if (testInfo.status !== testInfo.expectedStatus) {
        const tracePath = testInfo.outputPath('trace.zip');
        const saved = await safeTracing(() => context.tracing.stopChunk({ path: tracePath }));
        if (saved) {
          // Named 'trace' so the HTML reporter shows its built-in "View trace" button.
          await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
        }
      } else {
        await safeTracing(() => context.tracing.stopChunk());
      }
    }

    // The browser may have died during the test itself — nothing left to clean up on it.
    if (!context.browser()?.isConnected()) {
      return;
    }

    await Promise.all(
      context
        .pages()
        .filter(p => !pagesBefore.has(p))
        .map(p => p.close().catch(() => {}))
    );
    await context.clearCookies();

    const worker = context.serviceWorkers()[0];
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
