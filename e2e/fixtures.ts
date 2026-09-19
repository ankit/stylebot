import {
  test as base,
  chromium,
  firefox,
  type BrowserContext,
  type Page,
  type TestInfo,
  type WorkerInfo,
} from '@playwright/test';
import fs from 'node:fs';
import type http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { FirefoxExtension } from './firefox-rdp';

// Mirrors scripts/launch-chrome.mjs — `yarn test:e2e:edge` runs the suite on Edge,
// which uses the same dist/ build as Chrome. `yarn test:e2e:firefox` runs it on
// Firefox against the separate firefox-dist/ build.
const BROWSER = process.env.STYLEBOT_BROWSER ?? 'chrome';
export const IS_FIREFOX = BROWSER === 'firefox';
const CHANNEL = BROWSER === 'edge' ? 'msedge' : 'chrome';

const DIST_PATH = path.resolve(
  __dirname,
  '..',
  IS_FIREFOX ? 'firefox-dist' : 'dist'
);

/**
 * Neither of Playwright's Firefox drivers can attach to moz-extension:// documents
 * (Juggler skips them; BiDi excludes extension contexts, bug 1755014), so tests that
 * click through the popup can't run there. Call at file scope in such specs.
 */
export function skipWithoutPopup(): void {
  test.skip(
    IS_FIREFOX,
    'Playwright cannot drive extension pages (the popup) in Firefox'
  );
}

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

type Instance = {
  context: BrowserContext;
  userDataDir: string;
  extensionId: string;
  firefoxExtension: FirefoxExtension | null;
};

type ExtensionFunction<A, R> = (arg: A) => R | Promise<R>;
export type RunInExtension = <A, R>(
  fn: ExtensionFunction<A, R>,
  arg?: A
) => Promise<R>;

function freePort(): Promise<number> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

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

    const rdpPort = IS_FIREFOX ? await freePort() : null;
    const context = IS_FIREFOX
      ? await firefox.launchPersistentContext(userDataDir, {
          headless,
          viewport: null,
          colorScheme: null,
          // Playwright can't install extensions into Firefox; the debugger server
          // exposes the same protocol about:debugging uses to load one temporarily.
          args: [`--start-debugger-server=${rdpPort}`],
          firefoxUserPrefs: {
            'devtools.debugger.prompt-connection': false,
            // MV3 treats <all_urls> content scripts as optional host permissions
            // that a user would normally have to grant on install.
            'extensions.originControls.grantByDefault': true,
            // Firefox terminates idle event pages after 30s, which would take
            // the console we run chrome.storage calls through with it.
            'extensions.background.idle.timeout': 3_600_000,
          },
        })
      : // Chrome 137+ removed --load-extension; CDP's Extensions domain replaces it below.
        await chromium.launchPersistentContext(userDataDir, {
          headless,
          channel: CHANNEL,
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
      await safeTracing(() =>
        context.tracing.start({ screenshots: false, snapshots: true })
      );
    }

    const instance = rdpPort
      ? await this.loadFirefoxExtension(context, userDataDir, rdpPort)
      : await this.loadChromiumExtension(context, userDataDir);
    this.instances.push(instance);
    return instance;
  }

  private async loadChromiumExtension(
    context: BrowserContext,
    userDataDir: string
  ): Promise<Instance> {
    const cdp = await context.browser()!.newBrowserCDPSession();
    const { id: extensionId } = await cdp.send('Extensions.loadUnpacked', {
      path: DIST_PATH,
    });

    return { context, userDataDir, extensionId, firefoxExtension: null };
  }

  private async loadFirefoxExtension(
    context: BrowserContext,
    userDataDir: string,
    rdpPort: number
  ): Promise<Instance> {
    const firefoxExtension = await FirefoxExtension.load(rdpPort, DIST_PATH);

    return {
      context,
      userDataDir,
      extensionId: firefoxExtension.uuid,
      firefoxExtension,
    };
  }

  /**
   * Runs `fn(arg)` with the extension's own privileges — in the background
   * service worker on Chromium, or the background page on Firefox.
   */
  async runInExtension<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    const { context, firefoxExtension } = await this.get();

    if (firefoxExtension) {
      return firefoxExtension.evaluate(fn, arg);
    }

    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));
    return worker.evaluate(fn as (arg: A) => R, arg as A);
  }

  // Tears down every instance this worker ever launched, not just the current one —
  // a mid-suite relaunch leaves earlier instances orphaned otherwise.
  async closeAll(): Promise<void> {
    await Promise.all(
      this.instances.map(async ({ context, userDataDir, firefoxExtension }) => {
        firefoxExtension?.close();
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
    runInExtension: RunInExtension;
    openPopup: () => Promise<Page>;
  },
  {
    browserPool: BrowserPool;
  }
>({
  browserPool: [
    async ({}, use, workerInfo) => {
      const pool = new BrowserPool(
        workerInfo,
        isLiveTraceMode(workerInfo.project.use)
      );
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
        const saved = await safeTracing(() =>
          context.tracing.stopChunk({ path: tracePath })
        );
        if (saved) {
          // Named 'trace' so the HTML reporter shows its built-in "View trace" button.
          await testInfo.attach('trace', {
            path: tracePath,
            contentType: 'application/zip',
          });
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

    // On Chromium an idle-terminated service worker has nothing left to clear, and
    // waiting for it to come back would stall teardown.
    if (IS_FIREFOX || context.serviceWorkers().length > 0) {
      await browserPool.runInExtension(() => chrome.storage.local.clear());
    }
  },

  runInExtension: async ({ browserPool }, use) => {
    await use((fn, arg) => browserPool.runInExtension(fn, arg));
  },

  // Opens the popup by URL (Playwright can't click a real toolbar icon), in the
  // background so it doesn't steal "current tab" from the page under test.
  openPopup: async ({ context, extensionId }, use) => {
    if (IS_FIREFOX) {
      throw new Error(
        'openPopup is unavailable on Firefox — see skipWithoutPopup() in fixtures.ts.'
      );
    }

    const cdp = await context.browser()!.newBrowserCDPSession();

    const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;

    const open = async (): Promise<Page> => {
      // Filtered so the onInstalled help tab can't win this race instead.
      const pagePromise = context.waitForEvent(
        'page',
        p => p.url() === popupUrl
      );
      await cdp.send('Target.createTarget', {
        url: popupUrl,
        background: true,
      });
      return pagePromise;
    };

    await use(open);
  },
});

export const expect = test.expect;
