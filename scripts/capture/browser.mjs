// Headless Chrome with the built extension loaded, and the pieces each store
// shot is built from: seeded storage, a site tab, the side panel beside it.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

export const WIDTH = 1280;
export const HEIGHT = 800;
export const PANEL_WIDTH = 360;
export const PAGE_WIDTH = WIDTH - PANEL_WIDTH - 1;

const DIVIDER = { light: '#d9d9de', dark: '#2c2f35' };

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chrome launch options shared by the extension browser and the CLI's: hi-dpi,
 * so the shots are sharp once scaled to the store's size.
 */
export const launchOptions = ({ appearance, env }) => ({
  headless: true,
  channel: 'chrome',
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
  colorScheme: appearance,
  env,
  ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
  args: [
    '--enable-unsafe-extension-debugging',
    '--window-size=1400,900',
    '--hide-scrollbars',
  ],
});

/**
 * Loads an unpacked build into the context and returns its id.
 */
export const loadExtension = async (context, dir) => {
  const cdp = await context.browser().newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: dir });
  return id;
};

/**
 * Closes the welcome tab the extension opens on install, whenever it shows up.
 */
export const closeWelcomeTabs = context =>
  context.on('page', page =>
    page.once('framenavigated', () => {
      if (page.url().includes('stylebot.dev/welcome')) {
        page.close().catch(() => {});
      }
    })
  );

/**
 * A fresh browser and profile with dist/ loaded, in light or dark mode.
 */
export const launch = async ({ appearance }) => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-store-'));
  const context = await chromium.launchPersistentContext(
    userDataDir,
    launchOptions({ appearance })
  );
  closeWelcomeTabs(context);

  const id = await loadExtension(context, path.join(rootDir, 'dist'));
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));

  return {
    context,
    id,
    evaluate: (fn, arg) => worker.evaluate(fn, arg),
    close: async () => {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
};

/**
 * A saved style as storage holds it.
 */
export const style = (css, extra = {}) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime: new Date().toISOString(),
  ...extra,
});

/**
 * A style with profiles, using the first one.
 */
export const profiles = (...list) =>
  style(list[0].css, {
    profiles: Object.fromEntries(
      list.map(({ name, css }, i) => [
        i ? `profile-${i}` : 'default',
        { name, css },
      ])
    ),
    activeProfile: 'default',
  });

/**
 * Writes items straight to storage, dropping the compiled styles so pages ask
 * the background to rebuild them.
 */
export const seed = (browser, items) =>
  browser.evaluate(async items => {
    await chrome.storage.local.remove('styles-compiled');
    await chrome.storage.local.set(items);
  }, items);

/**
 * Opens a site in its own tab. `width` lays the page out wider than the space
 * it gets in the shot, for sites whose layout wraps at the panel's width.
 */
export const openSite = async (
  context,
  url,
  { width = PAGE_WIDTH, full = false } = {}
) => {
  const page = await context.newPage();
  const space = full ? WIDTH : PAGE_WIDTH;
  await page.setViewportSize({
    width: full ? WIDTH : width,
    height: Math.round((HEIGHT * (full ? WIDTH : width)) / space),
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  return page;
};

/**
 * Opens the side panel's page for the site's tab in a tab of its own, at the
 * panel's width. Playwright can't reach the real side panel, and this is the
 * same page connected to the same tab.
 */
export const openPanel = async (browser, page) => {
  const url = page.url();
  const tabId = await browser.evaluate(
    async url => (await chrome.tabs.query({})).find(tab => tab.url === url)?.id,
    url
  );

  const panel = await browser.context.newPage();
  // Cards and menus appear at once rather than animating in.
  await panel.emulateMedia({ reducedMotion: 'reduce' });
  await panel.setViewportSize({ width: PANEL_WIDTH, height: HEIGHT });
  await panel.goto(
    `chrome-extension://${browser.id}/editor-window/index.html?tabId=${tabId}&host=sidepanel`
  );
  await panel.waitForTimeout(2500);
  return panel;
};

/**
 * Stops the inspector the side panel opens with, and switches to a tab.
 */
export const showTab = async (panel, tab) => {
  await panel.locator('button.stylebot-inspector').click();
  if (tab) {
    await panel.locator('button.tab', { hasText: tab }).click();
  }
  await panel.waitForTimeout(1500);
};

const png = async page => (await page.screenshot()).toString('base64');

/**
 * Renders html at the store's size and saves it as a PNG, returning it too.
 * `scale: 'device'` keeps the 2x pixels instead.
 */
export const render = async (context, html, file, { scale = 'css' } = {}) => {
  const page = await context.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.setContent(html);
  await page.waitForTimeout(300);
  // Drawn at 2x and saved at the store's size, which keeps text sharp.
  const image = await page.screenshot({ path: file ?? undefined, scale });
  await page.close();
  return image;
};

/**
 * Saves the page, with the panel beside it when there is one, as one shot.
 */
export const capture = async (
  context,
  file,
  page,
  panel,
  { appearance, scale }
) => {
  const [site, side] = await Promise.all([png(page), panel && png(panel)]);
  const image = (data, width) =>
    `<img src="data:image/png;base64,${data}" style="display:block;width:${width}px;height:${HEIGHT}px">`;

  return render(
    context,
    `<body style="margin:0;display:flex;gap:1px;background:${
      DIVIDER[appearance]
    }">
      ${image(site, side ? PAGE_WIDTH : WIDTH)}
      ${side ? image(side, PANEL_WIDTH) : ''}
    </body>`,
    file,
    { scale }
  );
};
