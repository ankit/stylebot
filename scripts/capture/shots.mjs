// The store screenshots, in listing order. Chrome takes the first five, Edge
// takes all of them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rootDir } from '../lib/cli.mjs';
import {
  WIDTH,
  HEIGHT,
  capture,
  openPanel,
  openSite,
  profiles,
  seed,
  showTab,
  style,
  wait,
} from './browser.mjs';
import { captureCli } from './cli-shot.mjs';

const THEMES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'themes'
);

export const theme = name =>
  fs.readFileSync(path.join(THEMES_DIR, `${name}.css`), 'utf8');

export const gallery = (site, name) =>
  fs.readFileSync(
    path.join(rootDir, 'site/src/assets/gallery', site, `${name}.css`),
    'utf8'
  );

// GitHub wraps the repo's last-commit row at the panel's width, so it's laid
// out a little wider and scaled into the space.
const GITHUB_WIDTH = 1012;

const hackerNews = active => {
  const list = [
    { name: 'Night Shift', css: gallery('hn', 'night-shift') },
    { name: 'Modern', css: theme('hn-modern') },
    { name: 'Newspaper', css: gallery('hn', 'newspaper') },
    { name: 'Newspaper Dark', css: gallery('hn', 'newspaper-dark') },
  ];
  const index = list.findIndex(({ name }) => name === active);
  return {
    ...profiles(...list),
    css: list[index].css,
    activeProfile: index ? `profile-${index}` : 'default',
  };
};

/**
 * Clicks More ideas until the first card is `label`. The deck starts at a
 * random look, and every look comes round within ten presses.
 */
const dealUntil = async (panel, label) => {
  const first = panel.locator('.chat-suggestions-slot').first();
  for (let i = 0; i < 10; i++) {
    if ((await first.innerText().catch(() => '')).includes(label)) {
      // Off the button, so it isn't shown hovered.
      await panel.mouse.move(0, 0);
      return;
    }
    await panel.getByText('More ideas').click();
    await panel.waitForTimeout(1200);
  }
  throw new Error(`Chat never dealt "${label}" first`);
};

const history = () => {
  const at = (hours, minutes) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  return [
    ['nytimes.com', 15, 12],
    ['en.wikipedia.org', 16, 4],
    ['mail.google.com', 17, 40],
    ['news.ycombinator.com', 18, 26],
    ['github.com', 19, 5],
    ['news.ycombinator.com', 19, 48],
    ['github.com', 20, 31],
    ['github.com', 21, 9],
  ].map(([url, hours, minutes], i) => ({
    id: `store-${i}`,
    modifiedTime: at(hours, minutes),
    source: 'local',
    before: { [url]: style(`body { color: #33${i}; }`) },
  }));
};

export const SHOTS = [
  {
    name: '1-pick-element',
    about: 'Picking an element: Wikipedia in Slate',
    appearance: 'dark',
    run: async (browser, file) => {
      await seed(browser, {
        styles: {
          'en.wikipedia.org': profiles(
            { name: 'Slate', css: gallery('wikipedia', 'slate') },
            { name: 'Parchment', css: gallery('wikipedia', 'parchment') }
          ),
        },
      });
      // An article without images up top, so Slate's two columns stay full.
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Ikigai'
      );
      const panel = await openPanel(browser, page);
      await page.locator('#firstHeading').hover();
      await wait(900);
      await capture(browser.context, file, page, panel, { appearance: 'dark' });
    },
  },
  {
    name: '2-chat',
    about: "Chat's suggestions: GitHub in dark mode",
    appearance: 'dark',
    run: async (browser, file) => {
      // A placeholder, so Chat shows its composer; no reply is ever requested.
      await seed(browser, {
        'chat-api-key-anthropic': 'sk-ant-store-screenshot-placeholder',
        'chat-provider': 'anthropic',
      });
      const page = await openSite(
        browser.context,
        'https://github.com/ankit/stylebot',
        {
          width: GITHUB_WIDTH,
        }
      );
      const panel = await openPanel(browser, page);
      await showTab(panel, 'Chat');
      await dealUntil(panel, 'Morning newspaper');
      await capture(browser.context, file, page, panel, { appearance: 'dark' });
    },
  },
  {
    name: '3-cli',
    about: 'Claude Code restyling Hacker News through the CLI',
    appearance: 'light',
    // Runs its own browser, set up for the CLI.
    standalone: true,
    run: file => captureCli(file, gallery('hn', 'newspaper')),
  },
  {
    name: '4-profiles',
    about: 'Profiles: Hacker News in Newspaper Dark',
    appearance: 'dark',
    run: async (browser, file) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews('Newspaper Dark') },
      });
      const page = await openSite(
        browser.context,
        'https://news.ycombinator.com/'
      );
      const panel = await openPanel(browser, page);
      await showTab(panel);
      await panel.getByRole('button', { name: 'Switch profile' }).click();
      await wait(600);
      await capture(browser.context, file, page, panel, { appearance: 'dark' });
    },
  },
  {
    name: '5-readability',
    about: 'Readability: Wikipedia with its settings open',
    appearance: 'light',
    run: async (browser, file) => {
      await seed(browser, {
        styles: { 'en.wikipedia.org': style('', { readability: true }) },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Blue_Prince',
        {
          full: true,
        }
      );
      await wait(2500);
      await page.getByRole('button', { name: /Aa/ }).first().click();
      await wait(800);
      await capture(browser.context, file, page, null, { appearance: 'light' });
    },
  },
  {
    name: '6-code',
    about: 'The Code tab: GitHub in Dracula',
    appearance: 'dark',
    run: async (browser, file) => {
      await seed(browser, {
        styles: {
          'github.com': profiles(
            { name: 'Dracula', css: gallery('github', 'dracula') },
            { name: 'Solarized', css: gallery('github', 'solarized') },
            { name: 'Terminal', css: gallery('github', 'terminal') }
          ),
        },
      });
      const page = await openSite(
        browser.context,
        'https://github.com/ankit/stylebot',
        {
          width: GITHUB_WIDTH,
        }
      );
      const panel = await openPanel(browser, page);
      await showTab(panel, 'Code');
      await wait(1500);
      await capture(browser.context, file, page, panel, { appearance: 'dark' });
    },
  },
  {
    name: '7-version-history',
    about: 'Version history in Options',
    appearance: 'dark',
    run: async (browser, file) => {
      const sites = [
        'news.ycombinator.com',
        'github.com',
        'mail.google.com',
        'nytimes.com',
        'en.wikipedia.org',
        'www.reddit.com',
        'www.youtube.com',
        'stackoverflow.com',
        'docs.python.org',
        'www.bbc.com',
        'news.google.com',
        'developer.mozilla.org',
      ];
      await seed(browser, {
        styles: Object.fromEntries(
          sites.map(url => [url, style('body { margin: 0; }')])
        ),
        'version-history': history(),
      });

      const page = await browser.context.newPage();
      await page.setViewportSize({ width: WIDTH, height: HEIGHT });
      await page.goto(`chrome-extension://${browser.id}/options.html#/history`);
      await wait(1500);
      await page.locator('[aria-expanded]').nth(1).click();
      // An unreleased build still reports the last release's version.
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('body *')) {
          if (!el.children.length && /^v\d+\.\d+/.test(el.textContent.trim())) {
            el.style.visibility = 'hidden';
          }
        }
      });
      await wait(600);
      await capture(browser.context, file, page, null, { appearance: 'dark' });
    },
  },
];
