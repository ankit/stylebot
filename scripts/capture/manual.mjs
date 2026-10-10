// Takes the stylebot.dev manual's and 4.0 release page's screenshots from the
// current build, in light and dark, into site/src/assets/manual/:
//
//   yarn capture:manual [<name>...] [--no-build]

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import {
  HEIGHT,
  WIDTH,
  capture,
  launch,
  openPanel,
  openSite,
  profiles,
  seed,
  showTab,
  style,
  wait,
} from './browser.mjs';
import { gallery, theme } from './shots.mjs';

const OUT_DIR = path.join(rootDir, 'site/src/assets/manual');

// The site already depends on sharp, for Astro's images.
const sharp = createRequire(path.join(rootDir, 'site/package.json'))('sharp');

const APPEARANCES = ['light', 'dark'];

const CHAT_KEY = {
  'chat-api-key-anthropic': 'sk-ant-manual-screenshot-placeholder',
  'chat-provider': 'anthropic',
};

const hackerNews = () =>
  profiles(
    { name: 'Newspaper', css: gallery('hn', 'newspaper') },
    { name: 'Night Shift', css: gallery('hn', 'night-shift') },
    { name: 'Modern', css: theme('hn-modern') },
    { name: 'Newspaper Dark', css: gallery('hn', 'newspaper-dark') }
  );

const wikipedia = appearance =>
  appearance === 'dark'
    ? profiles(
        { name: 'Slate', css: gallery('wikipedia', 'slate') },
        { name: 'Parchment', css: gallery('wikipedia', 'parchment') }
      )
    : profiles(
        { name: 'Parchment', css: gallery('wikipedia', 'parchment') },
        { name: 'Slate', css: gallery('wikipedia', 'slate') }
      );

/**
 * Screenshots the smallest box around every locator, with some room around
 * it, at the page's 2x scale.
 */
const around = async (page, locators, padding = 12) => {
  const boxes = await Promise.all(
    locators.map(async locator => {
      await locator.waitFor();
      return locator.boundingBox();
    })
  );
  const viewport = page.viewportSize();
  const x = Math.max(0, Math.min(...boxes.map(box => box.x)) - padding);
  const y = Math.max(0, Math.min(...boxes.map(box => box.y)) - padding);
  const right = Math.min(
    viewport.width,
    Math.max(...boxes.map(box => box.x + box.width)) + padding
  );
  const bottom = Math.min(
    viewport.height,
    Math.max(...boxes.map(box => box.y + box.height)) + padding
  );
  return page.screenshot({
    clip: { x, y, width: right - x, height: bottom - y },
  });
};

/**
 * Opens a page of Options at a hash route, at the store's size.
 */
const openOptions = async (browser, route) => {
  const page = await browser.context.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.goto(`chrome-extension://${browser.id}/options.html#/${route}`);
  await wait(1500);
  return page;
};

/**
 * Opens the popup by URL in a background tab, as the e2e suite does, so the
 * site's tab stays the active one the popup reads.
 */
const openPopup = async browser => {
  const url = `chrome-extension://${browser.id}/popup/index.html`;
  const opened = browser.context.waitForEvent('page', p => p.url() === url);
  const cdp = await browser.context.browser().newBrowserCDPSession();
  await cdp.send('Target.createTarget', { url, background: true });
  const popup = await opened;
  await popup.waitForLoadState('load');
  await wait(1500);
  return popup;
};

/**
 * Seeded sync state that reads as connected and synced a few minutes ago.
 */
const syncState = () => {
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

const history = () => {
  const at = minutesAgo => new Date(Date.now() - minutesAgo * 60 * 1000);
  return [
    ['news.ycombinator.com', 240],
    ['en.wikipedia.org', 190],
    ['github.com', 150],
    ['github.com', 95],
    ['news.ycombinator.com', 60],
    ['mail.google.com', 20],
  ].map(([url, minutesAgo], i) => ({
    id: `manual-${i}`,
    modifiedTime: at(minutesAgo).toISOString(),
    source: 'local',
    before: { [url]: style(`body { color: #33${i}; }`) },
  }));
};

// A finished exchange about the Night Shift theme already on the page.
const chatThread = () => [
  {
    role: 'user',
    id: 'u1',
    text: 'make this easy on the eyes at night, like my code editor',
  },
  {
    role: 'assistant',
    id: 'a1',
    text: 'Gave the page a Dracula palette: a deep purple-gray background with soft white text, a lavender header in place of the orange one, and JetBrains Mono throughout, so it reads like your editor.',
    edits: [
      {
        selector: 'body',
        declarations: [
          { property: 'background-color', value: '#282a36' },
          { property: 'color', value: '#f8f8f2' },
        ],
      },
      {
        selector: '#hnmain',
        declarations: [{ property: 'font-family', value: 'JetBrains Mono' }],
      },
    ],
    previous: [
      { selector: 'body', property: 'background-color', value: null },
      { selector: 'body', property: 'color', value: null },
      { selector: '#hnmain', property: 'font-family', value: null },
    ],
    applied: true,
    model: 'claude-sonnet-5-5',
    usage: { inputTokens: 14200, outputTokens: 480, cacheReadTokens: 0 },
  },
  {
    role: 'user',
    id: 'u2',
    text: "what's a good name for this theme?",
  },
  {
    role: 'assistant',
    id: 'a2',
    text: 'A few ideas, depending on the mood you like:\n\n- **Night Shift**: says what it’s for.\n- **Terminal Hours**: a nod to the monospace type.\n- **Lavender Dusk**: after the header’s color.',
    edits: [],
    previous: [],
    applied: true,
    model: 'claude-sonnet-5-5',
    usage: { inputTokens: 15100, outputTokens: 120, cacheReadTokens: 14200 },
  },
];

const SHOTS = [
  {
    name: 'editor-panel',
    about: 'The panel with a Hacker News element picked',
    run: async (browser, { appearance }) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews(appearance) },
      });
      const page = await openSite(
        browser.context,
        'https://news.ycombinator.com/'
      );
      const panel = await openPanel(browser, page);
      await page.locator('.score').first().click();
      await wait(1200);
      await panel.evaluate(() => document.activeElement?.blur());
      await panel.mouse.move(0, 0);
      return around(panel, [
        panel.locator('.header'),
        panel.getByRole('button', { name: 'Add property' }),
      ]);
    },
  },
  {
    name: 'agent-chat',
    about: "Chat's suggestions, before anything is asked",
    run: async (browser, { appearance }) => {
      await seed(browser, {
        ...CHAT_KEY,
        styles: { 'en.wikipedia.org': wikipedia(appearance) },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Ikigai'
      );
      const panel = await openPanel(browser, page);
      await showTab(panel, 'Chat');
      await panel.mouse.move(0, 0);
      return around(panel, [
        panel.locator('.chat-empty-title'),
        panel.locator('.chat-composer'),
      ]);
    },
  },
  {
    name: 'position-menu',
    about: "The panel's menu: position and theme",
    run: async (browser, { appearance }) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews(appearance) },
      });
      const page = await openSite(
        browser.context,
        'https://news.ycombinator.com/'
      );
      const panel = await openPanel(browser, page);
      await showTab(panel);
      await panel.locator('.more-action-anchor button').click();
      await wait(600);
      await panel.mouse.move(0, 0);
      return panel.locator('.more-menu').screenshot();
    },
  },
  {
    name: 'popup-profiles',
    about: "The popup with Hacker News's profiles",
    run: async (browser, { appearance }) => {
      await seed(browser, {
        ...syncState(),
        styles: { 'news.ycombinator.com': hackerNews(appearance) },
      });
      // Opening the popup syncs; with no Google account here, answer for it.
      await browser.context.addInitScript(() => {
        if (location.protocol !== 'chrome-extension:') {
          return;
        }
        const send = chrome.runtime.sendMessage.bind(chrome.runtime);
        chrome.runtime.sendMessage = (message, callback) =>
          message?.name === 'RunGoogleDriveSync'
            ? callback?.({ ok: true })
            : send(message, callback);
      });
      await openSite(browser.context, 'https://news.ycombinator.com/');
      const popup = await openPopup(browser);
      return popup.locator('body > *').first().screenshot();
    },
  },
  {
    name: 'history',
    about: 'Version history in Options',
    run: async browser => {
      await seed(browser, {
        styles: Object.fromEntries(
          [
            'news.ycombinator.com',
            'github.com',
            'mail.google.com',
            'en.wikipedia.org',
          ].map(url => [url, style('body { margin: 0; }')])
        ),
        'version-history': history(),
      });
      const page = await openOptions(browser, 'history');
      const rows = page.locator('[aria-expanded]');
      return around(page, [
        page.getByRole('heading', { name: 'Version history' }),
        rows.nth(3),
      ]);
    },
  },
  {
    name: 'sync',
    about: 'Sync in Options, connected to Google Drive',
    run: async browser => {
      await seed(browser, syncState());
      const page = await openOptions(browser, 'sync');
      return around(page, [
        page.getByRole('heading', { name: 'Sync' }),
        page.locator('.card').first(),
      ]);
    },
  },
  {
    name: 'basic-editor',
    about: 'The Basic tab beside Wikipedia, a link picked',
    format: 'webp',
    run: async (browser, { appearance }) => {
      await seed(browser, {
        styles: { 'en.wikipedia.org': wikipedia(appearance) },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Valheim'
      );
      const panel = await openPanel(browser, page);
      // Down to Gameplay, where both columns are text.
      await page
        .locator('#Gameplay')
        .evaluate(heading =>
          window.scrollTo(0, heading.getBoundingClientRect().top + scrollY - 12)
        );
      await wait(800);
      const link = page
        .locator('#Gameplay')
        .locator('xpath=following::p//a[not(contains(@class,"new"))]')
        .nth(2);
      await link.click();
      await wait(1200);
      // Back to inspecting, to show a hovered element's selector too.
      await panel.locator('button.stylebot-inspector').click();
      await wait(600);
      await panel.evaluate(() => document.activeElement?.blur());
      await link.hover();
      await wait(900);
      return capture(browser.context, null, page, panel, {
        appearance,
        scale: 'device',
      });
    },
  },
  {
    name: 'chat',
    about: 'A Chat conversation beside Hacker News in Night Shift',
    format: 'webp',
    run: async (browser, { appearance }) => {
      await seed(browser, {
        ...CHAT_KEY,
        'chat-thread-news.ycombinator.com': chatThread(),
        styles: {
          'news.ycombinator.com': style(gallery('hn', 'night-shift')),
        },
      });
      const page = await openSite(
        browser.context,
        'https://news.ycombinator.com/'
      );
      const panel = await openPanel(browser, page);
      await showTab(panel, 'Chat');
      await panel.mouse.move(0, 0);
      return capture(browser.context, null, page, panel, {
        appearance,
        scale: 'device',
      });
    },
  },
  {
    name: 'readability',
    about: 'Readability on Wikipedia with its settings open',
    format: 'webp',
    run: async (browser, { appearance }) => {
      await seed(browser, {
        styles: { 'en.wikipedia.org': style('', { readability: true }) },
        'readability-settings': {
          size: 16,
          width: 40,
          theme: appearance,
          lineHeight: 1.6,
          justify: false,
          font: 'Merriweather',
        },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Mathematics',
        { full: true }
      );
      await wait(2500);
      // Past the lead image, to the article's opening paragraphs.
      await page
        .getByText(/^Mathematics is a field/)
        .first()
        .evaluate(lead => lead.scrollIntoView({ block: 'start' }));
      await page.mouse.wheel(0, -24);
      await wait(800);
      await page.getByRole('button', { name: /Aa/ }).first().click();
      await wait(800);
      return capture(browser.context, null, page, null, {
        appearance,
        scale: 'device',
      });
    },
  },
];

const USAGE = `usage: yarn capture:manual [<name>...] [--no-build]

  --no-build  skip the rebuild (dist must already be current)

With no names, retakes every shot below, each in light and dark.

Shots:
${SHOTS.map(shot => `  ${shot.name.padEnd(16)}${shot.about}`).join('\n')}
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const wanted = args.filter(arg => !arg.startsWith('--'));
const shots = wanted.length
  ? SHOTS.filter(({ name }) => wanted.includes(name))
  : SHOTS;

if (!shots.length) {
  console.error(`No shot named ${wanted.join(', ')}.\n\n${USAGE}`);
  process.exit(1);
}

if (!args.includes('--no-build')) {
  runOrExit(bin('yarn'), ['build']);
}

let failed = 0;

for (const shot of shots) {
  for (const appearance of APPEARANCES) {
    const format = shot.format ?? 'png';
    const label = `${shot.name}${appearance === 'dark' ? '-dark' : ''}`;
    const file = path.join(OUT_DIR, `${label}.${format}`);
    const browser = await launch({ appearance });

    try {
      const image = await shot.run(browser, { appearance });
      await (format === 'webp'
        ? sharp(image).webp({ quality: 90 }).toFile(file)
        : fs.promises.writeFile(file, image));
      console.log(`✓ ${label}`);
    } catch (error) {
      failed++;
      console.error(`✗ ${label}: ${error.message.split('\n')[0]}`);
    } finally {
      await browser.close();
    }
  }
}

console.log(`\nSaved to ${path.relative(rootDir, OUT_DIR)}/`);
process.exit(failed ? 1 : 0);
