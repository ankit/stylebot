// The App Store's iPhone screenshots: what Stylebot does on an iPhone, which
// has the popup, Options and Readability but no editor. Chrome stands in for
// Safari, as an iPhone with touch input, so the pages take their iPhone layout.

import {
  markTitle,
  openPopup,
  render,
  seed,
  sharp,
  SLIDE_BACKGROUND,
  stubGallery,
  style,
  syncState,
  wait,
} from './browser.mjs';
import { hackerNews, history, listedGallery, openOptions } from './shots.mjs';

/**
 * An iPhone 17 Pro Max's screen in points; its 3x pixels are the size the App
 * Store asks for 6.9" displays, 1320×2868.
 */
export const IPHONE = { width: 440, height: 956, scale: 3 };

const SHEET = { inset: 8, radius: 36, maxHeight: 0.72 };

const SCREEN = { top: 196, side: 36, radius: 44, bottom: 28 };

// The status bar's height, which the page sits below.
const STATUS_BAR = 62;

const png = async page => (await page.screenshot()).toString('base64');

/**
 * The colour of a screenshot's top left pixel, for the status bar above it.
 */
const topColor = async base64 => {
  const pixel = await sharp(Buffer.from(base64, 'base64'))
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();

  return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
};

/**
 * Opens a site in a tab the size of the iPhone's screen.
 */
const openSite = async (context, url) => {
  const page = await context.newPage();
  await page.setViewportSize({
    width: IPHONE.width,
    height: IPHONE.height - STATUS_BAR,
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  return page;
};

/**
 * Sizes the popup to its content at the iPhone's width, as Safari's sheet
 * holds it, up to most of the screen.
 */
const fitSheet = async popup => {
  await popup.setViewportSize({
    width: IPHONE.width - SHEET.inset * 2,
    height: IPHONE.height,
  });
  await wait(500);
  const height = await popup.evaluate(() =>
    Math.ceil(document.querySelector('.popup').getBoundingClientRect().height)
  );
  await popup.setViewportSize({
    width: IPHONE.width - SHEET.inset * 2,
    height: Math.min(height, Math.round(IPHONE.height * SHEET.maxHeight)),
  });
};

/**
 * Opens the popup for the site's tab, sized as Safari's sheet holds it.
 */
const openSheet = async (browser, page) => {
  const popup = await openPopup(browser, page);
  await fitSheet(popup);
  return popup;
};

/**
 * Renders the iPhone's screen, a page with the popup's sheet over its bottom
 * when there is one, as a slide with its title above.
 */
const capture = async (
  context,
  file,
  page,
  sheet,
  { title, accent, appearance }
) => {
  const [site, menu] = await Promise.all([png(page), sheet && png(sheet)]);
  const statusBar = await topColor(site);
  const zoom = Math.min(
    (IPHONE.width - SCREEN.side * 2) / IPHONE.width,
    (IPHONE.height - SCREEN.top - SCREEN.bottom) / IPHONE.height
  );
  const width = IPHONE.width * zoom;
  const shadow = {
    light: '0 0 0 1px #0000001a,0 8px 40px #00000040',
    dark: '0 0 0 1px #ffffff26,0 8px 40px #000000b3',
  };
  const sheetHtml = sheet
    ? `<div style="position:absolute;inset:0;background:#00000026"></div>
       <img src="data:image/png;base64,${menu}" style="position:absolute;left:${
        SHEET.inset
      }px;bottom:${SHEET.inset}px;width:${
        sheet.viewportSize().width
      }px;height:${sheet.viewportSize().height}px;border-radius:${
        SHEET.radius
      }px;box-shadow:${shadow[appearance]}">`
    : '';

  await render(
    context,
    `<body style="margin:0;height:${
      IPHONE.height
    }px;overflow:hidden;background:${SLIDE_BACKGROUND};font-family:-apple-system,system-ui,sans-serif">
      <h1 style="margin:0;padding:64px 28px 0;text-align:center;font-size:38px;line-height:1.15;font-weight:700;letter-spacing:-0.03em;color:#16171a">${markTitle(
        title,
        accent
      )}</h1>
      <div style="position:absolute;top:${SCREEN.top}px;left:${
      (IPHONE.width - width) / 2
    }px;width:${width}px;height:${
      IPHONE.height * zoom
    }px;overflow:hidden;border-radius:${
      SCREEN.radius
    }px;box-shadow:0 0 0 1px #0000001f,0 20px 60px #00000033">
        <div style="position:relative;width:${IPHONE.width}px;height:${
      IPHONE.height
    }px;transform:scale(${zoom});transform-origin:0 0">
          <div style="height:${STATUS_BAR}px;background:${statusBar}"></div>
          <img src="data:image/png;base64,${site}" style="display:block;width:${
      IPHONE.width
    }px;height:${IPHONE.height - STATUS_BAR}px">
          ${sheetHtml}
        </div>
      </div>
    </body>`,
    file,
    { scale: 'device', width: IPHONE.width, height: IPHONE.height }
  );
};

export const IPHONE_SHOTS = [
  {
    name: '1-gallery',
    about: "The popup's Gallery: Hacker News previewing Daily HN Edition, dark",
    appearance: 'dark',
    slide: { title: 'Try styles from the *Gallery*.', accent: 'pink' },
    run: async (browser, file, options) => {
      const site = 'news.ycombinator.com';

      await stubGallery(browser, site, await listedGallery(site));
      const page = await openSite(browser.context, `https://${site}/`);
      const popup = await openSheet(browser, page);
      await popup.getByRole('button', { name: /Daily HN Edition/ }).click();
      await wait(2500);
      await fitSheet(popup);
      await page.bringToFront();
      await wait(500);
      await capture(browser.context, file, page, popup, {
        ...options,
        appearance: 'dark',
      });
    },
  },
  {
    name: '2-profiles',
    about: 'Profiles in the popup: Hacker News in Newspaper',
    appearance: 'light',
    slide: { title: 'Switch *looks* in a tap.', accent: 'yellow' },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews('Newspaper') },
      });
      const page = await openSite(
        browser.context,
        'https://news.ycombinator.com/'
      );
      const sheet = await openSheet(browser, page);
      await page.bringToFront();
      await wait(500);
      await capture(browser.context, file, page, sheet, {
        ...options,
        appearance: 'light',
      });
    },
  },
  {
    name: '3-readability',
    about: 'Readability: Wikipedia with its settings open',
    appearance: 'light',
    slide: { title: 'Read without the *clutter*.', accent: 'pink' },
    run: async (browser, file, options) => {
      // Wikipedia sends an iPhone to its mobile site.
      await seed(browser, {
        styles: {
          'en.wikipedia.org': style('', { readability: true }),
          'en.m.wikipedia.org': style('', { readability: true }),
        },
      });
      const page = await openSite(
        browser.context,
        'https://en.wikipedia.org/wiki/Blue_Prince'
      );
      await wait(2500);
      await page.getByRole('button', { name: /Aa/ }).first().click();
      await wait(800);
      await capture(browser.context, file, page, null, {
        ...options,
        appearance: 'light',
      });
    },
  },
  {
    name: '4-sync',
    about: 'Sync in Options, connected to Google Drive',
    appearance: 'dark',
    slide: { title: 'Your styles, on *every device*.', accent: 'yellow' },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: { 'news.ycombinator.com': hackerNews('Newspaper') },
        ...syncState(),
      });
      const page = await openOptions(
        browser,
        'sync',
        IPHONE.width,
        IPHONE.height - STATUS_BAR
      );
      await wait(600);
      await capture(browser.context, file, page, null, {
        ...options,
        appearance: 'dark',
      });
    },
  },
  {
    name: '5-version-history',
    about: 'Version history in Options',
    appearance: 'dark',
    slide: { title: 'Go back to *any version*.', accent: 'blue' },
    run: async (browser, file, options) => {
      await seed(browser, {
        styles: Object.fromEntries(
          ['news.ycombinator.com', 'github.com', 'en.wikipedia.org'].map(
            url => [url, style('body { margin: 0; }')]
          )
        ),
        'version-history': history(),
      });
      const page = await openOptions(
        browser,
        'history',
        IPHONE.width,
        IPHONE.height - STATUS_BAR
      );
      await page.locator('[aria-expanded]').nth(1).click();
      await wait(600);
      await capture(browser.context, file, page, null, {
        ...options,
        appearance: 'dark',
      });
    },
  },
];
