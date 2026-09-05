// Launches Chrome with the Stylebot extension and hot-reloads it on every rebuild.
// Uses CDP instead of --load-extension since Chrome 137+ disabled that flag.

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
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
// Set by `yarn dev:chrome:headless`: no window, for hands-off verification runs.
const headless = process.env.STYLEBOT_HEADLESS === '1';

const readMarker = () => (existsSync(buildMarkerPath) ? readFileSync(buildMarkerPath, 'utf8') : null);

// Resolves once the marker file's content differs from `baseline`.
const waitForMarkerChange = (baseline) =>
  new Promise((resolve) => {
    // fs.watch throws ENOENT if the directory doesn't exist yet, which is
    // the case on a fresh checkout before `yarn watch` has run once.
    mkdirSync(extensionPath, { recursive: true });

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
      ? '⏳ Waiting for the initial build from `yarn watch`...'
      : '⏳ Waiting for the build (dist/) — run `yarn build` or `yarn watch`...'
  );
  await waitForMarkerChange(baseline);
};

await waitForBuild();

// `kill 0` on exit doesn't let Chrome shut down cleanly, so it shows a "Restore
// pages?" bubble on the next launch. Reset the exit flags in the profile first.
const clearCrashFlags = () => {
  const prefsPath = path.join(userDataDir, 'Default', 'Preferences');
  if (!existsSync(prefsPath)) return;
  try {
    const prefs = JSON.parse(readFileSync(prefsPath, 'utf8'));
    prefs.profile = { ...prefs.profile, exit_type: 'Normal', exited_cleanly: true };
    writeFileSync(prefsPath, JSON.stringify(prefs));
  } catch {
    // Malformed or locked prefs — not worth failing the launch over.
  }
};
clearCrashFlags();

const context = await chromium.launchPersistentContext(userDataDir, {
  headless,
  // Playwright's bundled "Chrome for Testing" build gets flagged as a bot by some sites.
  channel: 'chrome',
  // Otherwise Playwright adds --no-sandbox, which real Chrome (unlike "for Testing") nags about.
  chromiumSandbox: true,
  // Without this, Playwright pins a fixed emulated viewport and the window can't resize.
  viewport: null,
  ignoreDefaultArgs: [
    // Playwright disables extensions by default, which would block our CDP-loaded one.
    '--disable-extensions',
    // Playwright's default; sets navigator.webdriver=true, flagged as a bot by Google.
    '--enable-automation',
  ],
  args: [
    // Required for Extensions.loadUnpacked.
    '--enable-unsafe-extension-debugging',
    ...(headless ? [] : ['--start-maximized']),
  ],
});

const cdp = await context.browser().newBrowserCDPSession();

// Dropping --enable-automation still leaves navigator.webdriver=true (CDP sets it);
// spoof it here rather than via --disable-blink-features, which nags with an infobar.
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
});

// Stamp a small corner badge with the worktree name on every page, so this dev window is
// identifiable at a glance (including in the Cmd+Tab window-preview thumbnail on macOS).
await context.addInitScript((label) => {
  // Only badge the top frame, never iframes (e.g. stylebot's monaco editor).
  if (window.top !== window) {
    return;
  }
  const addBadge = () => {
    const badge = document.createElement('div');
    badge.textContent = `🌲 ${label}`;
    Object.assign(badge.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      zIndex: 2147483647,
      background: '#4b2e83',
      color: '#fff',
      font: '15px -apple-system, sans-serif',
      padding: '5px 10px',
      borderRadius: '6px',
      pointerEvents: 'none',
      opacity: '0.85',
    });
    document.documentElement.append(badge);
  };
  document.addEventListener('DOMContentLoaded', addBadge);
}, path.basename(rootDir));

// The extension opens this tab on fresh install (onInstalled); auto-close it in dev.
const closeHelpTab = (p) => {
  if (/^https:\/\/stylebot\.dev\/help/.test(p.url())) {
    p.close().catch(() => {});
  }
};
context.on('page', (p) => {
  closeHelpTab(p);
  p.once('framenavigated', () => closeHelpTab(p));
});

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

const extensionId = await loadExtension();

// Navigate after installing so the content script injects on load.
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(startUrl);

console.log(`\n🎉 Stylebot loaded on Hacker News — extension id: ${extensionId}`);
console.log('👀 Watching ./dist — the extension hot-reloads in place on rebuild.');
console.log(headless ? '🛑 Press Ctrl+C to exit.\n' : '🪟 Close the browser window to exit.\n');

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
    console.log(`🔄 reloaded  ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('❌ reload failed:', err.message);
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
