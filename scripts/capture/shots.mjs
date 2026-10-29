// The store screenshots, in listing order. Chrome takes the first five, Edge
// takes all of them, and Safari all but the CLI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WIDTH,
  HEIGHT,
  PHONE,
  capture,
  capturePopup,
  fitPopup,
  openPanel,
  openPopup,
  openSite,
  profiles,
  seed,
  showTab,
  style,
  stubGallery,
  syncState,
  wait,
} from './browser.mjs';
import { captureCli } from './cli-shot.mjs';
import { gallery } from './themes.mjs';

/**
 * A theme kept beside these scripts, for one the site's gallery doesn't list.
 */
const localTheme = name =>
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), `${name}.css`),
    'utf8'
  );

export const hnModern = () => localTheme('hn-modern');

const GALLERY_API = 'https://api.stylebot.dev/v1';

/**
 * A site's styles as the Gallery lists them, each with its CSS, so the
 * slide shows what someone would really find there.
 */
const listedGallery = async site => {
  const fetchJson = async url => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }

    return response.json();
  };
  const { styles } = await fetchJson(
    `${GALLERY_API}/styles?${new URLSearchParams({ site })}`
  );

  return Promise.all(
    styles.map(({ id }) => fetchJson(`${GALLERY_API}/styles/${id}`))
  );
};

// GitHub wraps the repo's last-commit row at the panel's width, so it's laid
// out a little wider and scaled into the space.
const GITHUB_WIDTH = 1012;

/**
 * The width a store slide or the phone tour lays the page out at, if either.
 */
const pageWidth = options => (options.slide ?? options.phone)?.pageWidth;

/**
 * Opens the panel beside a page, at the phone tour's width when it's for that.
 */
const openPanelFor = (browser, page, options) =>
  openPanel(browser, page, options.phone && PHONE.panel);

const hackerNews = active => {
  const list = [
    { name: 'Night Shift', css: gallery('hn', 'night-shift') },
    { name: 'Modern', css: hnModern() },
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

/**
 * Opens a page of Options, hiding the version an unreleased build reports,
 * which is still the last release's.
 */
const openOptions = async (browser, route, width = WIDTH) => {
  const page = await browser.context.newPage();
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(`chrome-extension://${browser.id}/options.html#/${route}`);
  await wait(1500);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (!el.children.length && /^v\d+\.\d+/.test(el.textContent.trim())) {
        el.style.visibility = 'hidden';
      }
    }
  });
  return page;
};

export const SHOTS = [
  {
    name: '1-pick-element',
    about: 'Picking an element: Wikipedia in Slate',
    appearance: 'dark',
    slide: {
      title: 'Point at *anything*. Restyle it.',
      accent: 'pink',
      pageWidth: 440,
    },
    phone: { pageWidth: 400 },
    run: async (browser, file, options) => {
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
        'https://en.wikipedia.org/wiki/Ikigai',
        { space: pageWidth(options) }
      );
      // Wikipedia's fundraising and campaign banners come and go.
      await page.addStyleTag({ content: '#centralNotice { display: none; }' });
      const panel = await openPanelFor(browser, page, options);
      await page.locator('#firstHeading').hover();
      await wait(900);
      await capture(browser.context, file, page, panel, {
        appearance: 'dark',
        ...options,
      });
    },
  },
  {
    name: '2-code',
    about: 'The Code tab: GitHub in Dracula',
    appearance: 'dark',
    slide: {
      title: 'Write *CSS* when you want to.',
      accent: 'blue',
      pageWidth: 380,
    },
    phone: { pageWidth: 400 },
    run: async (browser, file, options) => {
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
        pageWidth(options)
          ? { space: pageWidth(options) }
          : { width: GITHUB_WIDTH }
      );
      // The repo's topics name Chrome, which the Mac App Store doesn't allow.
      await page.addStyleTag({
        content:
          'header.HeaderMktg, [class*="TopicTagGroup"] { display: none !important; }',
      });
      const panel = await openPanelFor(browser, page, options);
      await showTab(panel, 'Code');
      await wait(1500);
      await capture(browser.context, file, page, panel, {
        appearance: 'dark',
        ...options,
      });
    },
  },
  {
    name: '3-gallery',
    about: "The popup's Gallery: Hacker News previewing Daily HN Edition, dark",
    appearance: 'dark',
    slide: {
      title: 'Try styles from the *Gallery*.',
      accent: 'pink',
      crop: { x: 380 },
    },
    run: async (browser, file, options) => {
      const site = 'news.ycombinator.com';

      await stubGallery(browser, site, await listedGallery(site));
      const page = await openSite(browser.context, `https://${site}/`, {
        full: true,
      });
      const popup = await openPopup(browser, page);
      await popup.getByRole('button', { name: /Daily HN Edition/ }).click();
      await wait(2500);
      await fitPopup(popup);
      await page.bringToFront();
      await wait(500);
      await capturePopup(browser.context, file, page, popup, {
        appearance: 'dark',
        ...options,
      });
    },
  },
  {
    name: '4-sync',
    about: 'Sync in Options, connected to Google Drive',
    appearance: 'dark',
    slide: {
      title: 'Your styles, on *every computer*.',
      accent: 'yellow',
      pageWidth: 740,
    },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews('Newspaper') },
        ...syncState(),
      });
      const page = await openOptions(browser, 'sync', pageWidth(options));
      await wait(600);
      await capture(browser.context, file, page, null, {
        appearance: 'dark',
        ...options,
      });
    },
  },
  {
    name: '5-cli',
    about: 'The CLI restyling Hacker News from a terminal',
    appearance: 'light',
    slide: {
      title: 'Restyle from the *command line*.',
      accent: 'indigo',
    },
    // Runs its own browser, set up for the CLI.
    standalone: true,
    // Safari builds don't carry the CLI.
    cli: true,
    run: (file, options) =>
      captureCli(file, gallery('hn', 'newspaper'), options),
  },
  {
    name: '6-profiles',
    about: 'Profiles: Wikipedia in Parchment',
    appearance: 'light',
    slide: {
      title: 'Switch *looks* in a click.',
      accent: 'yellow',
      pageWidth: 400,
    },
    phone: { pageWidth: 400 },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: {
          'en.wikipedia.org': {
            ...profiles(
              { name: 'Slate', css: gallery('wikipedia', 'slate') },
              { name: 'Parchment', css: gallery('wikipedia', 'parchment') }
            ),
            css: gallery('wikipedia', 'parchment'),
            activeProfile: 'profile-1',
          },
        },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Bonsai',
        { space: pageWidth(options) }
      );
      await page.addStyleTag({ content: '#centralNotice { display: none; }' });
      const panel = await openPanelFor(browser, page, options);
      await showTab(panel);
      await panel.getByRole('button', { name: 'Switch profile' }).click();
      await wait(600);
      await capture(browser.context, file, page, panel, {
        appearance: 'light',
        ...options,
      });
    },
  },
  {
    name: '7-version-history',
    about: 'Version history in Options',
    appearance: 'dark',
    slide: {
      title: 'Go back to *any version*.',
      accent: 'blue',
      pageWidth: 740,
    },
    run: async (browser, file, options) => {
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

      const page = await openOptions(browser, 'history', pageWidth(options));
      await page.locator('[aria-expanded]').nth(1).click();
      await wait(600);
      await capture(browser.context, file, page, null, {
        appearance: 'dark',
        ...options,
      });
    },
  },
  {
    name: '8-readability',
    about: 'Readability: Wikipedia with its settings open',
    appearance: 'light',
    slide: {
      title: 'Read without the *clutter*.',
      accent: 'pink',
      pageWidth: 760,
    },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: { 'en.wikipedia.org': style('', { readability: true }) },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Blue_Prince',
        { full: true, space: pageWidth(options) }
      );
      await wait(2500);
      await page.getByRole('button', { name: /Aa/ }).first().click();
      await wait(800);
      await capture(browser.context, file, page, null, {
        appearance: 'light',
        ...options,
      });
    },
  },
];
