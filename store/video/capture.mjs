// Records the demo's raw material: the real extension in headless Chrome on a
// saved copy of Wikipedia's Ikigai article, driven by a human-paced cursor.
// Each surface (site, side panel, popup) is screenshotted to its own frames,
// and everything that happens is written to a timeline the Remotion project
// turns into the video.

import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(HERE, 'public/capture');
const BUILD = path.join(ROOT, 'preview-dist');
const CLI = path.join(ROOT, 'tools/cli/lib/cli.mjs');
const SITE_URL = 'https://en.wikipedia.org/wiki/Ikigai';
// A fixed copy of the article, so every take shows the same page.
const SITE_HTML = path.join(HERE, 'wiki-ikigai.html');
const SITE = 'en.wikipedia.org';
// What Claude's style is: the gallery's Slate theme, and the fonts it brings.
const THEME_FONTS = ['Playfair Display', 'Libre Baskerville'];
const THEME_PROFILE = 'Slate';
const PROMPT = '/stylebot give this article a calm dark reading look';

const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('@playwright/test');
const { launchOptions, loadExtension, closeWelcomeTabs } = await import(
  path.join(ROOT, 'scripts/capture/browser.mjs')
);
const { gallery } = await import(path.join(ROOT, 'scripts/capture/themes.mjs'));

// Content area of the browser window, in CSS px. The video draws Chrome's
// frame around it; the side panel takes the right PANEL_W when open.
const LAYOUT = {
  width: 1280,
  height: 720,
  panelWidth: 360,
  panelHeader: 40,
  popupWidth: 320,
  dpr: 2,
};
const SITE_W_OPEN = LAYOUT.width - LAYOUT.panelWidth;
// Where the toolbar's Stylebot icon sits, in content coordinates (y < 0 is
// Chrome's toolbar), and where its popup opens.
LAYOUT.icon = { x: LAYOUT.width - 62, y: -22 };
LAYOUT.popup = { x: LAYOUT.width - LAYOUT.popupWidth - 10, y: 2 };
// What the video's browser shows in its tab and address bar.
LAYOUT.site = {
  title: 'Ikigai - Wikipedia',
  url: 'en.wikipedia.org/wiki/Ikigai',
  favicon: 'W',
  background: '#ffffff',
};
// Chrome's and Stylebot's theme in the video.
LAYOUT.theme = 'dark';

const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

fs.rmSync(OUT, { recursive: true, force: true });
for (const s of ['site', 'panel', 'popup']) {
  fs.mkdirSync(path.join(OUT, s), { recursive: true });
}

// ---------------------------------------------------------------- browser --

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-demo-'));
const env = { ...process.env, HOME: home };
delete env.STYLEBOT_SOCKET;
const cli = args =>
  new Promise(resolve =>
    execFile(
      process.execPath,
      [CLI, ...args],
      { cwd: home, env },
      (e, so, se) => resolve({ ok: !e, out: (so + se).trimEnd() })
    )
  );

const { key } = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'src/assets/manifest/manifest-dev.json'),
    'utf8'
  )
);
const copyBuild = (name, change = () => {}) => {
  const dir = path.join(home, name);
  fs.cpSync(BUILD, dir, { recursive: true });
  const file = path.join(dir, 'manifest.json');
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  change(m);
  fs.writeFileSync(file, JSON.stringify({ ...m, key }));
  return dir;
};

const userDataDir = path.join(
  home,
  'Library/Application Support/Google/Chrome'
);
fs.mkdirSync(userDataDir, { recursive: true });
const context = await chromium.launchPersistentContext(userDataDir, {
  ...launchOptions({ appearance: 'light', env }),
  deviceScaleFactor: LAYOUT.dpr,
});
closeWelcomeTabs(context);
// Wikipedia's fundraising and campaign banners load live; keep them out.
await context.route(/BannerLoader|beacon\/impression/, route => route.abort());
await context.route(SITE_URL, route =>
  route.fulfill({
    contentType: 'text/html; charset=utf-8',
    body: fs.readFileSync(SITE_HTML),
  })
);

// A first copy that requires the CLI's permissions leaves them granted.
await loadExtension(
  context,
  copyBuild('granted', m => {
    m.permissions.push(...(m.optional_permissions ?? []));
    m.host_permissions.push(...(m.optional_host_permissions ?? []));
    delete m.optional_permissions;
    delete m.optional_host_permissions;
  })
);
const id = await loadExtension(context, copyBuild('stylebot'));
await cli(['install']);
{
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html#/basics`);
  await options
    .getByRole('heading', {
      name: 'Let apps on this computer control Stylebot',
    })
    .click();
  for (let i = 0; i < 30 && !(await cli(['tabs'])).ok; i++) {
    await wait(500);
  }
  await options.close();
}
const worker =
  context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
// The popup's "New in this version" banner and the rating prompt, as already
// seen, so neither shows up in the video.
await worker.evaluate(() => {
  const release = chrome.runtime
    .getManifest()
    .version.split('.')
    .slice(0, 2)
    .join('.');
  return chrome.storage.local.set({
    [`notification~release/${release}`]: true,
    'notification~rating-prompt': true,
  });
});

const site = await context.newPage();
// The page stays light; Stylebot's own surfaces are dark (below).
await site.emulateMedia({ colorScheme: 'light' });
await site.addInitScript(() => {
  const style = document.createElement('style');
  style.textContent =
    '#siteNotice, #centralNotice, .cn-banner { display: none !important; }';
  document.documentElement.append(style);
});
await site.setViewportSize({ width: LAYOUT.width, height: LAYOUT.height });
await site.goto(SITE_URL, { waitUntil: 'load' });
const tabId = await worker.evaluate(
  async u => (await chrome.tabs.query({})).find(t => t.url === u)?.id,
  SITE_URL
);

const openPopup = async () => {
  const url = `chrome-extension://${id}/popup/index.html`;
  const pagePromise = context.waitForEvent('page', p => p.url() === url);
  const cdp = await context.browser().newBrowserCDPSession();
  await cdp.send('Target.createTarget', { url, background: true });
  const popup = await pagePromise;
  await popup.emulateMedia({ colorScheme: 'dark' });
  await popup.setViewportSize({ width: LAYOUT.popupWidth, height: 400 });
  await popup.waitForLoadState('load');
  await wait(600);
  const h = await popup.evaluate(
    () =>
      document.querySelector('#app, body > div')?.getBoundingClientRect()
        .height || document.body.scrollHeight
  );
  await popup.setViewportSize({
    width: LAYOUT.popupWidth,
    height: Math.ceil(h),
  });
  return popup;
};
let popup = await openPopup();
const panel = await context.newPage();
await panel.setViewportSize({
  width: LAYOUT.panelWidth,
  height: LAYOUT.height - LAYOUT.panelHeader,
});
await panel.emulateMedia({ colorScheme: 'dark' });
await panel.goto(
  `chrome-extension://${id}/editor-window/index.html?tabId=${tabId}&host=sidepanel`
);
await wait(2500);
// Loaded ahead so it's ready when it slides in, but with the picker off until
// Stylebot is opened.
const inspector = panel.locator('button.stylebot-inspector');
await inspector.click();
await wait(500);

// --------------------------------------------------------------- recording --

const t0 = Date.now();
const now = () => Date.now() - t0;
const timeline = {
  layout: LAYOUT,
  frames: { site: [], panel: [], popup: [] },
  cursor: [],
  clicks: [],
  captions: [],
  popup: [],
  panel: [],
  popupHeights: [],
  terminal: [],
  camera: [],
  marks: [],
  keys: [],
  holds: [],
};
const log = (...a) => console.log(`[${(now() / 1000).toFixed(1)}s]`, ...a);
const mark = name => timeline.marks.push({ t: now(), name });

let recording = true;
const loops = [];
// A resize sent while a screenshot is being taken doesn't take effect, so a
// page's loop can be paused around one.
const busy = new Map();
const paused = new Set();
/**
 * Screenshots a page over and over, keeping each frame that changed. Background
 * tabs can't be screencast at the right size, but screenshots are exact.
 */
const record = (name, page) => {
  let n = timeline.frames[name].length;
  let last = null;
  const loop = (async () => {
    while (recording && !page.isClosed()) {
      if (paused.has(page)) {
        await wait(10);
        continue;
      }
      const t = now();
      let buf;
      try {
        const shot = page.screenshot({ type: 'jpeg', quality: 86 });
        busy.set(page, shot);
        buf = await shot;
      } catch {
        break;
      } finally {
        busy.delete(page);
      }
      if (last && buf.equals(last)) {
        continue;
      }
      last = buf;
      const { width: w, height: h } = page.viewportSize();
      const file = `${name}/${n++}.jpg`;
      timeline.frames[name].push({ t, f: file, w, h });
      fs.writeFile(path.join(OUT, file), buf, () => {});
    }
  })();
  loops.push(loop);
};
record('site', site);
record('panel', panel);
record('popup', popup);

// ------------------------------------------------------------------ state --

const state = { panel: false, popup: false, terminal: false };
let cursor = { x: 760, y: 420 };
let lastPage = null;
timeline.cursor.push({ t: 0, ...cursor });

const setPanel = async show => {
  state.panel = show;
  timeline.panel.push({ t: now(), show });
  const width = show ? SITE_W_OPEN : LAYOUT.width;
  paused.add(site);
  await busy.get(site)?.catch(() => {});
  await site.setViewportSize({ width, height: LAYOUT.height });
  for (
    let i = 0;
    i < 50 && (await site.evaluate(() => innerWidth)) !== width;
    i++
  ) {
    await wait(20);
  }
  paused.delete(site);
};
const setPopup = show => {
  state.popup = show;
  timeline.popup.push({ t: now(), show });
};
const caption = text => timeline.captions.push({ t: now(), text });
// Camera: zoom into a point (content coordinates), or back out with zoom 1.
const camera = (zoom, x = LAYOUT.width / 2, y = LAYOUT.height / 2) =>
  timeline.camera.push({ t: now(), zoom, x, y });
const term = (kind, text = '') =>
  timeline.terminal.push({ t: now(), kind, text });

/**
 * Which page is under a content-coordinate point, and the point in its own
 * coordinates.
 */
const surfaceAt = ({ x, y }) => {
  if (state.popup) {
    const p = LAYOUT.popup;
    if (x >= p.x && x < p.x + LAYOUT.popupWidth && y >= p.y && y < p.y + 400) {
      return { page: popup, x: x - p.x, y: y - p.y };
    }
  }
  if (y < 0) {
    return null;
  }
  if (state.panel && x >= SITE_W_OPEN) {
    return y < LAYOUT.panelHeader
      ? null
      : { page: panel, x: x - SITE_W_OPEN, y: y - LAYOUT.panelHeader };
  }
  return { page: site, x, y };
};

/**
 * Moves the cursor like a hand: a curved path, eased in and out, with a small
 * overshoot and settle on longer moves. The real mouse follows it, so hover
 * states happen as the cursor passes.
 */
const moveTo = async (target, { speed = 1, precise = false } = {}) => {
  const from = { ...cursor };
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    return;
  }
  const duration = (220 + 140 * Math.log2(dist / 12 + 1)) / speed;
  const overshoot = dist > 180 && !precise ? rand(4, 9) : 0;
  const end = {
    x: target.x + (dx / dist) * overshoot,
    y: target.y + (dy / dist) * overshoot,
  };
  // Control points bowed to one side of the straight line.
  const bow = rand(-0.18, 0.18) * dist;
  const nx = -dy / dist;
  const ny = dx / dist;
  const c1 = {
    x: from.x + dx * 0.3 + nx * bow,
    y: from.y + dy * 0.3 + ny * bow,
  };
  const c2 = {
    x: from.x + dx * 0.75 + nx * bow * 0.5,
    y: from.y + dy * 0.75 + ny * bow * 0.5,
  };
  const bez = (s, a, b, c, d) =>
    (1 - s) ** 3 * a +
    3 * (1 - s) ** 2 * s * b +
    3 * (1 - s) * s * s * c +
    s ** 3 * d;
  const minJerk = s => 10 * s ** 3 - 15 * s ** 4 + 6 * s ** 5;

  const segments = [{ from, to: end, c1, c2, duration }];
  if (overshoot) {
    const back = { ...target };
    segments.push({
      from: end,
      to: back,
      c1: { x: end.x + (back.x - end.x) / 3, y: end.y + (back.y - end.y) / 3 },
      c2: {
        x: end.x + (2 * (back.x - end.x)) / 3,
        y: end.y + (2 * (back.y - end.y)) / 3,
      },
      duration: rand(110, 160),
    });
  }
  for (const seg of segments) {
    const start = Date.now();
    for (;;) {
      const s = Math.min(1, (Date.now() - start) / seg.duration);
      const e = minJerk(s);
      const p = {
        x: bez(e, seg.from.x, seg.c1.x, seg.c2.x, seg.to.x),
        y: bez(e, seg.from.y, seg.c1.y, seg.c2.y, seg.to.y),
      };
      cursor = p;
      timeline.cursor.push({
        t: now(),
        x: +p.x.toFixed(1),
        y: +p.y.toFixed(1),
      });
      const hit = surfaceAt(p);
      // Leaving a page moves its mouse off it, as a real pointer does, so
      // the picker doesn't keep highlighting what was last under it.
      if (lastPage && lastPage !== hit?.page) {
        await lastPage.mouse.move(-10, -10).catch(() => {});
      }
      lastPage = hit?.page ?? null;
      // A hand on its way somewhere doesn't hover what it passes over, so the
      // pages only feel the pointer as it arrives.
      const arriving = seg !== segments[0] || s >= 0.85;
      // The picker tints whatever is under the pointer, and over the gaps
      // between elements that's the whole page. A hand passing over them is
      // a blink; in a video it's a flash, so those points aren't sent.
      if (hit && arriving && !(hit.page === site && (await coversPage(hit)))) {
        await hit.page.mouse.move(hit.x, hit.y).catch(() => {});
      }
      if (s >= 1) {
        break;
      }
      await wait(14);
    }
  }
};

/**
 * Whether the element at a point on the site is page-sized (html, body, or a
 * table wrapping everything), so hovering it would tint the whole page.
 */
const coversPage = ({ x, y }) =>
  site
    .evaluate(
      ([px, py]) => {
        const el = document.elementFromPoint(px, py);
        if (!el) {
          return true;
        }
        const r = el.getBoundingClientRect();
        return r.width * r.height > innerWidth * innerHeight * 0.5;
      },
      [x, y]
    )
    .catch(() => false);

const boxOf = async (
  locator,
  origin = { x: 0, y: 0 },
  { at = 0.5, dx = 0 } = {}
) => {
  const b = await locator.boundingBox();
  if (!b) {
    throw new Error(`no box for ${locator}`);
  }
  return {
    x: origin.x + b.x + Math.min(b.width * at, b.width - 4) + dx + rand(-2, 2),
    y: origin.y + b.y + b.height / 2 + rand(-1.5, 1.5),
  };
};
const panelOrigin = () => ({ x: SITE_W_OPEN, y: LAYOUT.panelHeader });
const popupOrigin = () => ({ x: LAYOUT.popup.x, y: LAYOUT.popup.y });

/**
 * Presses at the cursor. `real: false` only shows the click, for things the
 * video draws itself (Chrome's toolbar) or that headless can't do.
 */
const click = async ({ real = true } = {}) => {
  await wait(rand(90, 180));
  timeline.clicks.push({ t: now(), x: cursor.x, y: cursor.y });
  const hit = surfaceAt(cursor);
  if (real && hit) {
    await hit.page.mouse.down();
    await wait(rand(60, 110));
    await hit.page.mouse.up();
  } else {
    await wait(90);
  }
  await wait(rand(120, 220));
};
const clickOn = async (locator, origin, opts = {}) => {
  await moveTo(await boxOf(locator, origin, opts), opts);
  await click(opts);
};

/**
 * Types with a person's rhythm: uneven keys, longer pauses between words.
 */
const typeHuman = async (page, text, { pace = 1 } = {}) => {
  for (const ch of text) {
    await page.keyboard.type(ch);
    timeline.keys.push(now());
    let base = rand(55, 120);
    if (ch === ' ') {
      base = rand(110, 220);
    } else if (/[{};:#]/.test(ch)) {
      base = rand(110, 190);
    }
    await wait(base / pace);
  }
};
const think = (a = 350, b = 700) => wait(rand(a, b));

/**
 * Runs a change that brings in web fonts, and has the video hold the page's
 * previous frame until they've loaded, so it doesn't show the fallback font
 * first and then reflow when the real one swaps in.
 */
const withFonts = async (families, change) => {
  const from = now();
  const result = await change();
  for (let i = 0; i < 120; i++) {
    const ready = await site
      .evaluate(
        // Faces the page doesn't draw with never load, so wait for the
        // families to be declared and nothing to be loading.
        names =>
          names.every(name =>
            [...document.fonts].some(
              f => f.family.replace(/["']/g, '') === name
            )
          ) && document.fonts.status === 'loaded',
        families
      )
      .catch(() => false);
    if (ready) {
      break;
    }
    await wait(40);
  }
  await settle();
  timeline.holds.push({ from, to: now() });
  return result;
};

/**
 * Waits for the page to finish laying out and painting the latest change, so
 * the frames after it aren't caught mid-repaint.
 */
async function settle() {
  await site
    .evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        )
    )
    .catch(() => {});
  // Reflowing a whole article can take a few frames more to paint.
  await wait(500);
}

/**
 * Runs a change that's typed in, and has the video hold the page's previous
 * frame until it's committed and painted. Values apply as they're typed, so
 * "18" would otherwise show the text at 1px first.
 */
const withHold = async change => {
  const from = now();
  const result = await change();
  await settle();
  timeline.holds.push({ from, to: now() });
  return result;
};

// ------------------------------------------------------------------ beats --

const editor = {
  field: name => panel.getByRole('textbox', { name, exact: true }).first(),
  section: name => panel.getByRole('button', { name, exact: true }),
  tab: name => panel.getByRole('tab', { name, exact: true }),
  picker: () =>
    panel.getByRole('button', {
      name: 'Select an element in the page to style it',
    }),
  // The field on the row with this label, in the Text section.
  row: label =>
    panel
      .locator('div', { has: panel.getByText(label, { exact: true }) })
      .filter({ has: panel.getByRole('textbox') })
      .last()
      .getByRole('textbox')
      .first(),
  // The Text and Background sections' hex fields, in that order.
  textColor: () => panel.locator('.color-picker .color-hex').first(),
  backgroundColor: () => panel.locator('.color-picker .color-hex').nth(1),
};

mark('start');
await wait(1200);

// Open the editor from the toolbar.
mark('open');
caption('Open Stylebot on any site.');
await think(300, 500);
await moveTo(LAYOUT.icon);
camera(1.35, LAYOUT.width - 220, 120);
await click({ real: false });
setPopup(true);
await think(500, 800);
await moveTo(
  await boxOf(
    popup.getByRole('button', { name: /Style this page/ }),
    popupOrigin(),
    { at: 0.35 }
  )
);
await click({ real: false });
setPopup(false);
await inspector.click();
await setPanel(true);
camera(1);
await wait(1400);

// Pick an element.
mark('pick');
caption('Pick anything on the page.');
camera(1.3, 380, 260);
const paragraphs = site.locator('#mw-content-text p:not(.mw-empty-elt)');
for (const [locator, at] of [
  [site.locator('#firstHeading'), 0.5],
  [paragraphs.nth(0), 0.4],
  [site.getByRole('link', { name: 'faith', exact: true }), 0.5],
  [paragraphs.nth(1), 0.55],
]) {
  await moveTo(await boxOf(locator, undefined, { at }), { speed: 0.8 });
  await think(250, 450);
}
await moveTo(await boxOf(paragraphs.nth(1), undefined, { at: 0.35 }), {
  speed: 0.8,
});
await think(300, 450);
await click();
await wait(900);

// Style it in Basic: a serif to read in, a bigger size, room between lines.
mark('style');
caption('Style it your way.');
camera(1.1, 640, 320);
await clickOn(editor.row('Font'), panelOrigin(), { at: 0.4 });
await think();
const option = panel
  .locator('[role="option"], li, .option')
  .filter({ hasText: /^\s*Newsreader\s*$/ })
  .first();
await withFonts(['Newsreader'], async () => {
  await typeHuman(panel, 'Newsreader');
  await think(600, 900);
  if (await option.count()) {
    await clickOn(option, panelOrigin(), { at: 0.3 });
  } else {
    await panel.keyboard.press('Enter');
  }
});
await think(900, 1200);

await clickOn(editor.row('Size'), panelOrigin(), { at: 0.5 });
await withHold(async () => {
  await panel.keyboard.press('Meta+A');
  await typeHuman(panel, '18');
  await panel.keyboard.press('Enter');
});
await think(900, 1200);

await clickOn(editor.row('Line Height'), panelOrigin(), { at: 0.5 });
await withHold(async () => {
  await panel.keyboard.press('Meta+A');
  await typeHuman(panel, '30');
  await panel.keyboard.press('Enter');
});
await think(1000, 1300);

// Links, in one vermilion accent.
await clickOn(editor.picker(), panelOrigin());
await moveTo(
  await boxOf(
    site.getByRole('link', { name: 'faith', exact: true }),
    undefined,
    { at: 0.4 }
  ),
  { speed: 0.8 }
);
await think(300, 500);
await click();
await wait(700);
// Picked as that one link; widen it to every link in the article from the
// selector's alternatives.
await clickOn(
  panel
    .getByRole('button', { name: 'Clear selector' })
    .locator('xpath=following-sibling::button[1]'),
  panelOrigin()
);
await think(700, 1000);
await clickOn(
  panel.getByRole('menuitem', { name: /^div\.mw-content-ltr a / }),
  panelOrigin(),
  { at: 0.3 }
);
await wait(600);
log('links as', (await panel.getByRole('combobox').textContent()).trim());
await clickOn(editor.textColor(), panelOrigin(), { at: 0.6 });
await withHold(async () => {
  await panel.keyboard.press('Meta+A');
  await typeHuman(panel, '#c8372d');
  await panel.keyboard.press('Enter');
});
await think(1400, 1700);

// Code: hide the header for a quieter page.
mark('code');
caption('Or write CSS.');
camera(1.1, 640, 320);
await clickOn(editor.tab('Code'), panelOrigin());
await wait(1500);
const monaco = panel.locator('iframe');
const mb = await monaco.boundingBox();
await moveTo({
  x: SITE_W_OPEN + mb.x + mb.width * 0.45,
  y: mb.y + Math.min(mb.height * 0.7, 520),
});
await click();
await panel.keyboard.press('Meta+ArrowDown');
await panel.keyboard.press('End');
await panel.keyboard.press('Enter');
await panel.keyboard.press('Enter');
await withHold(async () => {
  await typeHuman(panel, '.vector-header-container {');
  await panel.keyboard.press('Enter');
  // No Escape after: the suggestions close on their own at the semicolon,
  // and Escape would send focus back to the Code tab with a focus ring.
  await typeHuman(panel, 'display: none;');
});
await think(1800, 2100);

// Command line. The video cuts from here straight to the terminal beside
// the whole browser, so nothing between the two marks is shown.
mark('cli');
mark('cutStart');
camera(1);
await moveTo({ x: 520, y: 380 }, { speed: 0.8 });
await setPanel(false);
await wait(700);
state.terminal = true;
term('show');
await wait(700);
mark('cutEnd');
caption('Or ask your coding agent.');
let typed = '';
for (const ch of PROMPT) {
  typed += ch;
  term('input', typed);
  await wait(ch === ' ' ? rand(90, 170) : rand(35, 85));
}
await think(400, 600);
term('submit', PROMPT);
term('spinner', 'Restyling…');
await wait(1300);

const WORK = '~/.stylebot/work';
const cssFile = path.join(home, `${SITE}.css`);
fs.writeFileSync(cssFile, gallery('wikipedia', 'slate'));
const cssLines = fs.readFileSync(cssFile, 'utf8').trimEnd().split('\n').length;

/**
 * Output as Claude Code shows it: a few lines, then a count of the rest.
 */
const folded = (out, keep = 3) => {
  const lines = out.split('\n');
  return lines.length > keep + 1
    ? [
        ...lines.slice(0, keep),
        `… +${lines.length - keep} lines (ctrl+o to expand)`,
      ].join('\n')
    : out;
};
const tool = async (name, args, out, ms = 650) => {
  term('tool', JSON.stringify({ name, args, out }));
  await wait(ms);
};
// The CLI runs for real; its output is what the terminal shows.
const opened = await cli(['open', SITE_URL]);
const tab = opened.out.match(/\d{3,}/)?.[0] ?? '1';
await tool(
  'Bash',
  `stylebot open ${SITE_URL.replace('https://', '')}`,
  opened.out
);
await tool(
  'Bash',
  `stylebot profiles ${SITE}`,
  (
    await cli(['profiles', SITE])
  ).out,
  500
);
const created = await cli([
  'profile',
  'create',
  THEME_PROFILE,
  SITE,
  '--from',
  'Default',
  '--use',
]);
await tool(
  'Bash',
  `stylebot profile create "${THEME_PROFILE}" ${SITE} --from Default --use`,
  created.out
);
await tool(
  'Bash',
  `stylebot outline ${tab}`,
  folded((await cli(['outline', tab])).out),
  900
);
await tool(
  'Write',
  `${WORK}/${SITE}.css`,
  `Wrote ${cssLines} lines to ${WORK}/${SITE}.css`,
  1100
);
const set = await withFonts(THEME_FONTS, () =>
  cli(['css', 'set', SITE, '--file', cssFile])
);
log('css set', set.ok);
await tool(
  'Bash',
  `stylebot css set ${SITE} --file ${WORK}/${SITE}.css`,
  folded(set.out, 2),
  400
);
await wait(2600);
term(
  'say',
  'The dark reading style is saved. Now I’m checking it with a screenshot.'
);
await wait(900);
const shot = await cli(['screenshot', tab, '-o', path.join(home, 'shot.png')]);
await tool(
  'Bash',
  `stylebot screenshot ${tab} -o ${WORK}/${SITE}-1.png`,
  shot.ok ? `${WORK}/${SITE}-1.png` : shot.out,
  700
);
await tool('Bash', 'stylebot done', (await cli(['done'])).out, 600);
term('spinner', null);
term(
  'say',
  `The article now reads in a calm dark theme: slate background with soft grey text, Playfair Display headings, Libre Baskerville body text in two columns, and muted blue links. It’s saved as the “${THEME_PROFILE}” profile.`
);
await wait(3800);

// Profiles. Another cut, to the whole browser with the terminal gone.
mark('profiles');
mark('cutStart');
term('hide');
state.terminal = false;
await wait(500);
await popup.close();
await panel.close();
await site.bringToFront();
popup = await openPopup();
record('popup', popup);
await wait(900);
timeline.popupHeights.push({ t: now(), h: popup.viewportSize().height });
mark('cutEnd');
caption('Keep more than one look.');
camera(1.15, 820, 300);
await moveTo(LAYOUT.icon);
await click({ real: false });
setPopup(true);
await think(600, 900);
fs.writeFileSync(
  path.join(OUT, 'popup-aria.yml'),
  await popup.locator('body').ariaSnapshot()
);
// Each profile brings its own web fonts, held for like any other change.
for (const [name, fonts] of [
  ['Default', ['Newsreader']],
  [THEME_PROFILE, THEME_FONTS],
]) {
  const item = popup.getByText(name, { exact: true }).first();
  if (!(await item.count())) {
    log('popup has no', name);
    break;
  }
  await moveTo(await boxOf(item, popupOrigin(), { at: 0.3 }));
  await withFonts(fonts, () => click());
  await think(1700, 2000);
}
setPopup(false);
camera(1);
await moveTo({ x: 640, y: 420 }, { speed: 0.7 });
await wait(1500);
mark('end');

// ----------------------------------------------------------------- finish --

recording = false;
await Promise.all(loops);
timeline.duration = now();
fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(timeline));
log(
  'frames',
  Object.fromEntries(
    Object.entries(timeline.frames).map(([k, v]) => [k, v.length])
  )
);
await context.close();
fs.rmSync(home, { recursive: true, force: true });
log('done');
