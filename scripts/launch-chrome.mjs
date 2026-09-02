// Launches Chrome with the Stylebot extension and hot-reloads it in place on
// every rebuild. Uses CDP instead of --load-extension since Chrome 137+
// disabled that flag, and extensions loaded with it can't be reloaded.

import { chromium } from 'playwright';
import { existsSync, readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionPath = path.join(rootDir, 'dist');
// Written by WriteBuildMarkerPlugin (webpack.config.js) after each successful build.
const buildMarkerPath = path.join(extensionPath, '.build-complete');
const userDataDir = path.join(rootDir, '.chrome-dev-profile');
const startUrl = 'https://news.ycombinator.com';

// Set by `yarn dev:chrome`: wait for a build that finishes after this script
// starts, rather than trusting a marker left over from a previous run.
const waitForFreshBuild = process.env.STYLEBOT_FRESH_BUILD === '1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readMarker = () => (existsSync(buildMarkerPath) ? readFileSync(buildMarkerPath, 'utf8') : null);

// Resolves once the marker file's content differs from `baseline`.
const waitForMarkerChange = (baseline) =>
  new Promise((resolve) => {
    const checkNow = () => {
      if (readMarker() !== baseline) {
        watcher.close();
        resolve();
      }
    };
    const watcher = watch(extensionPath, (event, filename) => {
      if (filename === '.build-complete') {
        checkNow();
      }
    });
    checkNow(); // in case it changed before the watcher attached
  });

// Block until a build we can trust is ready before launching the browser.
const waitForBuild = async () => {
  const baseline = waitForFreshBuild ? readMarker() : null;

  if (readMarker() !== null && !waitForFreshBuild) {
    return;
  }

  console.log(
    waitForFreshBuild
      ? 'Waiting for the initial build from `yarn watch`...'
      : 'Waiting for the build (dist/) — run `yarn build` or `yarn watch`...'
  );
  await waitForMarkerChange(baseline);
};

await waitForBuild();

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  // Without this, Playwright pins a fixed emulated viewport and the window can't resize.
  viewport: null,
  // Playwright disables extensions by default, which would block our CDP-loaded one.
  ignoreDefaultArgs: ['--disable-extensions'],
  // Required for Extensions.loadUnpacked.
  args: ['--enable-unsafe-extension-debugging', '--start-maximized'],
});

const cdp = await context.browser().newBrowserCDPSession();

// Install the extension, or reload it in place if already installed.
const loadExtension = async () => {
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: extensionPath });
  return id;
};

// Reload open http(s) tabs so content scripts re-inject from the new build.
const reloadTabs = () =>
  Promise.all(
    context
      .pages()
      .filter((p) => /^https?:/.test(p.url()))
      .map((p) => p.reload().catch(() => {}))
  );

// Open the Stylebot editor via its in-page shortcut. This works without the
// background service worker, which is dormant right after a CDP install.
const openEditor = async (p) => {
  try {
    await p.bringToFront();
    await p.click('body', { position: { x: 5, y: 5 } }).catch(() => {});
    // Give the content script a moment to register its hotkeys.
    await sleep(500);
    await p.keyboard.press('Alt+Shift+M');
    // #stylebot is a 0-height host (its panel is fixed-positioned), so wait for
    // it to be attached rather than visible.
    await p.waitForSelector('#stylebot', { state: 'attached', timeout: 5000 }).catch(() => {});
  } catch {
    // The page may have navigated away mid-open; ignore.
  }
};

const extensionId = await loadExtension();

// Navigate after installing so the content script injects on load.
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(startUrl);
await openEditor(page);

console.log(`\n✓ Stylebot loaded on Hacker News — extension id: ${extensionId}`);
console.log('  Watching ./dist — the extension hot-reloads in place on rebuild.');
console.log('  Close the browser window to exit.\n');

let reloading = false;
let pending = false;

const hotReload = async () => {
  // Coalesce changes that arrive while a reload is already running.
  if (reloading) {
    pending = true;
    return;
  }
  reloading = true;
  try {
    await loadExtension();
    await reloadTabs();
    await openEditor(page);
    console.log(`↻ reloaded  ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('reload failed:', err.message);
  } finally {
    reloading = false;
    if (pending) {
      pending = false;
      hotReload();
    }
  }
};

const watcher = watch(extensionPath, (event, filename) => {
  if (filename === '.build-complete') {
    hotReload();
  }
});

// Keep the process alive until the user closes the browser.
await new Promise((resolve) => context.on('close', resolve));
watcher.close();
