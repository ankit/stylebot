// Headless Chrome with the built extension loaded, and the pieces each store
// shot is built from: seeded storage, a site tab, the side panel beside it.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
export const sharp = require('sharp');

export const WIDTH = 1280;
export const HEIGHT = 800;
export const PANEL_WIDTH = 360;
export const PAGE_WIDTH = WIDTH - PANEL_WIDTH - 1;

/**
 * The site's phone tour crops each shot to the panel, at Chrome's narrowest
 * side panel, and a strip of the page, so its text reads on a phone.
 */
export const PHONE = { panel: 320, strip: 48, height: 320 };

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
 * Seeded sync state that reads as connected and synced a few minutes ago.
 */
export const syncState = () => {
  const syncedAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  return {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': {
      remoteRevision: syncedAt,
      localRevision: syncedAt,
      lastSyncedAt: syncedAt,
      account: { email: 'you@gmail.com' },
      metadata: {
        id: 'manual',
        modifiedTime: syncedAt,
        webViewLink: 'https://drive.google.com/',
        webContentLink: 'https://drive.google.com/',
      },
    },
  };
};

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
 * Opens a site in its own tab, in `space` pixels of the shot. `width` lays the
 * page out wider than that, for sites whose layout wraps at the panel's width.
 */
export const openSite = async (
  context,
  url,
  { full = false, space = full ? WIDTH : PAGE_WIDTH, width = space } = {}
) => {
  const page = await context.newPage();
  await page.setViewportSize({
    width,
    height: Math.round((HEIGHT * width) / space),
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  return page;
};

/**
 * The id the extension knows a page's tab by.
 */
const tabIdOf = (browser, page) =>
  browser.evaluate(
    async url => (await chrome.tabs.query({})).find(tab => tab.url === url)?.id,
    page.url()
  );

/**
 * Opens the side panel's page for the site's tab in a tab of its own, at the
 * panel's width. Playwright can't reach the real side panel, and this is the
 * same page connected to the same tab.
 */
export const openPanel = async (browser, page, width = PANEL_WIDTH) => {
  const tabId = await tabIdOf(browser, page);

  const panel = await browser.context.newPage();
  // Cards and menus appear at once rather than animating in.
  await panel.emulateMedia({ reducedMotion: 'reduce' });
  await panel.setViewportSize({ width, height: HEIGHT });
  // Shown in a tab, the panel would take itself for Vivaldi's and close.
  await panel.addInitScript(() => {
    chrome.tabs.getCurrent = async () => undefined;
  });
  await panel.goto(
    `chrome-extension://${browser.id}/editor-window/index.html?tabId=${tabId}&host=sidepanel`
  );
  await panel.waitForTimeout(2500);
  return panel;
};

export const POPUP_WIDTH = 320;

/**
 * Opens the toolbar popup for the site's tab in a tab of its own, sized to
 * its content. Playwright can't click the toolbar icon, so the popup is told
 * the site's tab is the active one.
 */
export const openPopup = async (browser, page) => {
  const tabId = await tabIdOf(browser, page);

  const popup = await browser.context.newPage();
  await popup.emulateMedia({ reducedMotion: 'reduce' });
  await popup.setViewportSize({ width: POPUP_WIDTH, height: HEIGHT });
  await popup.addInitScript(tabId => {
    const query = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = (info, callback) => {
      if (!info.active) {
        return query(info, callback);
      }

      const found = chrome.tabs.get(tabId).then(tab => [tab]);
      found.then(tabs => callback?.(tabs));
      return found;
    };
  }, tabId);
  await popup.goto(`chrome-extension://${browser.id}/popup/index.html`);
  await popup.waitForTimeout(1500);
  return popup;
};

/**
 * Fits a popup's viewport to its content, as the browser sizes the real one.
 */
export const fitPopup = async popup => {
  const height = await popup.evaluate(() => document.body.scrollHeight);
  await popup.setViewportSize({ width: POPUP_WIDTH, height });
};

/**
 * Answers the extension's Gallery API requests with these styles, for a
 * site, instead of the live Gallery's. `total` is how many the site has.
 */
export const stubGallery = (browser, site, styles, total = styles.length) =>
  browser.evaluate(
    ({ site, styles, total }) => {
      const realFetch = globalThis.fetch;
      const json = body =>
        new Response(JSON.stringify(body), {
          headers: { 'Content-Type': 'application/json' },
        });

      globalThis.fetch = (input, init) => {
        const url = new URL(typeof input === 'string' ? input : input.url);

        if (url.hostname !== 'api.stylebot.dev') {
          return realFetch(input, init);
        }

        const id = Number(url.pathname.match(/\/styles\/(\d+)$/)?.[1]);

        if (url.pathname.endsWith('/sites/hosts')) {
          return Promise.resolve(json({ hosts: [site] }));
        }

        if (url.pathname.endsWith('/styles')) {
          const listed = styles.map(({ css: _css, ...style }) => style);
          return Promise.resolve(
            json({ styles: listed, total, nextOffset: null })
          );
        }

        if (id) {
          return Promise.resolve(json(styles.find(style => style.id === id)));
        }

        return Promise.resolve(new Response(null, { status: 404 }));
      };
    },
    { site, styles, total }
  );

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
export const render = async (
  context,
  html,
  file,
  { scale = 'css', width = WIDTH, height = HEIGHT } = {}
) => {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.setContent(html);
  await page.waitForTimeout(300);
  // Drawn at 2x and saved at the store's size, which keeps text sharp.
  const image = await page.screenshot({ path: file ?? undefined, scale });
  await page.close();
  return image;
};

const ACCENTS = {
  pink: '#ec4d86',
  blue: '#1c9fc4',
  yellow: '#e0a218',
  indigo: '#2563eb',
};

/**
 * Where a slide's screen sits: below the title, bleeding off the bottom edge.
 */
export const WINDOW = {
  top: 172,
  side: 72,
  radius: 14,
  width: WIDTH - 72 * 2,
  height: HEIGHT - 172,
};

/**
 * Renders a screen as a listing slide: the title above, and the part of the
 * screen from `crop` on enlarged into a window below it, so the UI still reads
 * at the size the store shows its images. `*word*` in the title is marked.
 */
export const slide = (
  context,
  { image, width },
  file,
  { title, accent, crop = {}, scale }
) => {
  const { x = 0, y = 0 } = crop;
  const zoom = WINDOW.width / (crop.width ?? width - x);
  const color = ACCENTS[accent];
  // Punctuation after the mark tucks in against its padding.
  const heading = title.replace(
    /\*(.+?)\*([.,!?]?)/,
    (_, word, mark) =>
      `<mark style="background:${color}40;color:inherit;padding:0 8px;margin:0 ${
        mark ? -6 : -2
      }px 0 -2px;border-radius:8px">${word}</mark>${mark}`
  );

  return render(
    context,
    `<body style="margin:0;height:${HEIGHT}px;overflow:hidden;background:#f6f3ee;font-family:-apple-system,system-ui,sans-serif">
      <h1 style="margin:0;padding-top:56px;text-align:center;font-size:56px;line-height:1.1;font-weight:700;letter-spacing:-0.03em;color:#16171a">${heading}</h1>
      <div style="position:absolute;top:${WINDOW.top}px;left:${
      WINDOW.side
    }px;width:${WINDOW.width}px;height:${
      WINDOW.height + WINDOW.radius
    }px;overflow:hidden;border-radius:${
      WINDOW.radius
    }px;box-shadow:0 0 0 1px #0000001f,0 20px 60px #00000033">
        <img src="data:image/png;base64,${image.toString(
          'base64'
        )}" style="display:block;width:${width * zoom}px;margin:${
      -y * zoom
    }px 0 0 ${-x * zoom}px">
      </div>
    </body>`,
    file,
    { scale }
  );
};

/**
 * Saves the part of a 2x screen inside `crop` as a WebP for the site, at 2x.
 */
export const cutOut = async (context, { image, width }, file, crop) => {
  const cut = await render(
    context,
    `<body style="margin:0;overflow:hidden">
      <img src="data:image/png;base64,${image.toString(
        'base64'
      )}" style="display:block;width:${width}px;margin:${-crop.y}px 0 0 ${-crop.x}px">
    </body>`,
    null,
    { scale: 'device', width: crop.width, height: crop.height }
  );
  await sharp(cut).webp({ quality: 90 }).toFile(file);
};

/**
 * Saves the page, with the panel beside it when there is one, as one shot, as
 * a slide when given one, or cut out for the phone tour. The page takes the
 * space openSite gave it.
 */
export const capture = async (
  context,
  file,
  page,
  panel,
  { appearance, scale, slide: frame, phone }
) => {
  const [site, side] = await Promise.all([png(page), panel && png(panel)]);
  const viewport = page.viewportSize();
  const space = Math.round((viewport.width * HEIGHT) / viewport.height);
  const panelWidth = panel?.viewportSize().width ?? 0;
  const width = space + (side ? panelWidth + 1 : 0);
  const img = (data, width) =>
    `<img src="data:image/png;base64,${data}" style="display:block;width:${width}px;height:${HEIGHT}px">`;

  // Slides and phone cut-outs are made from the screen at 2x.
  const reframed = Boolean(frame || phone);
  const image = await render(
    context,
    `<body style="margin:0;display:flex;gap:1px;background:${
      DIVIDER[appearance]
    }">
      ${img(site, space)}
      ${side ? img(side, panelWidth) : ''}
    </body>`,
    reframed ? null : file,
    { scale: reframed ? 'device' : scale, width }
  );
  if (phone) {
    return cutOut(context, { image, width }, file, {
      x: space - PHONE.strip,
      y: 0,
      width: PHONE.strip + 1 + panelWidth,
      height: PHONE.height,
    });
  }
  return frame
    ? slide(context, { image, width }, file, { ...frame, scale })
    : image;
};

/**
 * Saves the page with the popup open over its top right corner, as the
 * browser shows it below the toolbar, as one shot or a slide.
 */
export const capturePopup = async (
  context,
  file,
  page,
  popup,
  { appearance, scale, slide: frame }
) => {
  const [site, menu] = await Promise.all([png(page), png(popup)]);
  const width = page.viewportSize().width;
  const { height } = popup.viewportSize();
  const shadow = {
    light: '0 0 0 1px #0000001f,0 12px 40px #00000033',
    dark: '0 0 0 1px #ffffff26,0 12px 40px #00000099',
  };

  const image = await render(
    context,
    `<body style="margin:0;position:relative;overflow:hidden">
      <img src="data:image/png;base64,${site}" style="display:block;width:${width}px;height:${HEIGHT}px">
      <img src="data:image/png;base64,${menu}" style="position:absolute;top:8px;right:16px;width:${POPUP_WIDTH}px;height:${height}px;border-radius:10px;box-shadow:${shadow[appearance]}">
    </body>`,
    frame ? null : file,
    { scale: frame ? 'device' : scale, width }
  );

  return frame
    ? slide(context, { image, width }, file, { ...frame, scale })
    : image;
};
