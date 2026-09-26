import type { BrowserContext, Locator, Page } from '@playwright/test';
import { test, expect, type Extension, type Popup } from './fixtures';
import {
  PAGE_URL,
  openEditor,
  pickElement,
  seedStyles,
  servePage,
} from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

// Zen Kurenaido is served by Google Fonts but not in the bundled list.
const GOOGLE_FONTS = [
  'Playfair Display',
  'Lora',
  'Merriweather',
  'Zen Kurenaido',
];

const requestedFamily = (url: string): string =>
  decodeURIComponent(
    new URL(url).searchParams.get('family')?.split(':')[0] ?? ''
  ).replace(/\+/g, ' ');

const fontFaceFor = (family: string): string => `
  @font-face {
    font-family: '${family}';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/test.woff2) format('woff2');
  }
`;

const PREVIEW_ID = 'stylebot-css-font-preview';

const setup = async (
  context: BrowserContext,
  openPopup: () => Promise<Popup>
): Promise<{ page: Page; font: Locator }> => {
  await servePage(context, PAGE_HTML);
  // Like the real endpoint, unknown families answer 400.
  await context.route('https://fonts.googleapis.com/**', route => {
    const family = requestedFamily(route.request().url());

    return GOOGLE_FONTS.includes(family)
      ? route.fulfill({ contentType: 'text/css', body: fontFaceFor(family) })
      : route.fulfill({ status: 400, body: '' });
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');

  // page-scoped, not editorRoot-scoped: see e2e/color-picker.spec.ts.
  return { page, font: page.locator('.font-family-autocomplete') };
};

// Focusing the field opens the menu; with a value set it renders as chips
// until clicked, and the revealed input starts fully selected.
const openPicker = async (font: Locator): Promise<void> => {
  const chips = font.locator('.autocomplete-chips');

  if (await chips.count()) {
    await chips.click();
  } else {
    await font.locator('.autocomplete-input').click();
  }

  await expect(font.locator('.autocomplete-input')).toBeFocused();
};

// A row's accessible name is its label plus, for Google Fonts, the category.
const menuItem = (page: Page, name: string) =>
  page.getByRole('menuitem', {
    name: new RegExp(
      `^${name}( (sans-serif|serif|display|handwriting|monospace))?$`
    ),
  });

const SAVED_STYLES = `style[id^="stylebot-css-"]:not(#${PREVIEW_ID})`;

const savedStylesheet = (page: Page) => page.locator(SAVED_STYLES).first();

const savedCss = (page: Page) =>
  page
    .locator(SAVED_STYLES)
    .evaluateAll(els => els.map(el => el.textContent).join('\n'));

// removeCSSFromDocument empties the preview stylesheet rather than detaching it.
const previewCss = (page: Page) =>
  page
    .locator(`#${PREVIEW_ID}`)
    .evaluateAll(els => els.map(el => el.textContent).join(''));

const GOOGLE_FONTS_SITE = /^https:\/\/fonts\.google\.com/;

/**
 * Runs `action`, which makes the background open fonts.google.com in a new
 * tab, and waits for that tab to appear. The real site is a heavy SPA, and
 * context.route() can't reliably stub it — on Chromium the tab's request
 * starts before Playwright attaches to it. Closing the tab here isn't safe
 * either: on Firefox, closing an extension-opened tab can take the page under
 * test down with it. The per-test teardown closes it instead.
 */
const expectGoogleFontsOpened = async (
  context: BrowserContext,
  action: () => Promise<void>
): Promise<void> => {
  await context.route(GOOGLE_FONTS_SITE, route =>
    route.fulfill({ contentType: 'text/html', body: '<title>Fonts</title>' })
  );

  const opened = context.waitForEvent('page');
  await action();
  const fontsPage = await opened;
  await expect.poll(() => fontsPage.url()).toMatch(GOOGLE_FONTS_SITE);
};

const readRecentFonts = (extension: Extension) =>
  extension.evaluate(async () => {
    const { options } = await chrome.storage.local.get('options');
    return options?.fonts as Array<string> | undefined;
  });

// What the picker shows and how its keyboard works is covered by the
// Storybook interaction tests; the tests here prove what only the real
// extension can — the page restyles, the font is imported, and the
// background remembers it.
test('picking a Google Font applies it, imports it, and remembers it', async ({
  context,
  extension,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('playf');
  // The list fills once the font catalogue has loaded.
  await expect(menuItem(page, 'Playfair Display')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.locator('h1')).toHaveCSS('font-family', /Playfair Display/);

  const stylesheet = savedStylesheet(page);
  await expect.poll(() => stylesheet.textContent()).toContain('@font-face');
  await expect.poll(() => stylesheet.textContent()).toContain('Playfair');
  await expect.poll(() => previewCss(page)).toBe('');

  await expect
    .poll(async () => (await readRecentFonts(extension))?.[0])
    .toBe('Playfair Display');
});

test('a font outside Google Fonts is applied as typed, without an import', async ({
  context,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('Nonexistent Font');
  await page.keyboard.press('Enter');

  await expect(page.locator('h1')).toHaveCSS('font-family', /Nonexistent Font/);
  await expect
    .poll(() => savedStylesheet(page).textContent())
    .not.toContain('@font-face');
});

test('a font typed in another case is imported under its Google Fonts name', async ({
  context,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('lora');
  await page.keyboard.press('Enter');

  await expect(page.locator('h1')).toHaveCSS('font-family', /lora/);
  await expect
    .poll(() => savedStylesheet(page).textContent())
    .toContain('@font-face');
});

test('highlighting a Google Font outside the bundled list previews it with its import', async ({
  context,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('Zen Kurenaido');
  await page.keyboard.press('ArrowDown');

  await expect.poll(() => previewCss(page)).toContain('@font-face');
  await expect(page.locator('h1')).toHaveCSS('font-family', /Zen Kurenaido/);
  expect(await savedCss(page)).not.toContain('Zen Kurenaido');
});

test('the browse row opens Google Fonts in a new tab without applying anything', async ({
  context,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('playf');

  await expectGoogleFontsOpened(context, () =>
    menuItem(page, 'Browse Google Fonts').click()
  );

  await expect(page.locator('h1')).not.toHaveCSS('font-family', /playf/);
});

test('highlighting a font previews it on the page until the picker is dismissed', async ({
  context,
  extension,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);
  const heading = page.locator('h1');
  const initialFont = await heading.evaluate(
    el => getComputedStyle(el).fontFamily
  );

  await openPicker(font);
  await page.keyboard.type('playf');
  await page.keyboard.press('ArrowDown');

  await expect.poll(() => previewCss(page)).toContain('Playfair Display');
  await expect(heading).toHaveCSS('font-family', /Playfair Display/);
  expect(await savedCss(page)).not.toContain('Playfair');

  await page.keyboard.press('Escape');

  await expect.poll(() => previewCss(page)).toBe('');
  await expect(heading).toHaveCSS('font-family', initialFont);
  expect(await savedCss(page)).not.toContain('Playfair');
  expect((await readRecentFonts(extension))?.[0]).not.toBe('Playfair Display');

  // Escape keeps the typed text; clearing it lists the recents again.
  await font.locator('.autocomplete-input').fill('');
  await menuItem(page, 'Lora').hover();

  await expect.poll(() => previewCss(page)).toContain('Lora');
  await expect(heading).toHaveCSS('font-family', /Lora/);

  // Rows that aren't fonts (Browse, Default) preview nothing.
  await menuItem(page, 'Browse Google Fonts').hover();
  await expect.poll(() => previewCss(page)).toBe('');
  await expect(heading).toHaveCSS('font-family', initialFont);
});

test('a stack written in code mode can be replaced or extended', async ({
  context,
  extension,
  openPopup,
}) => {
  await seedStyles(extension, {
    localhost: {
      css: 'html body h1 { font-family: "Playfair Display", Georgia, serif; }',
      enabled: true,
    },
  });

  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('Lora');
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveCSS('font-family', 'Lora');

  await openPicker(font);
  // ArrowRight collapses the pre-selected value to its end (End only scrolls on macOS).
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(', Georgia, serif');
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveCSS(
    'font-family',
    'Lora, Georgia, serif'
  );

  await openPicker(font);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(', playf');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveCSS(
    'font-family',
    'Lora, Georgia, serif, "Playfair Display"'
  );

  // Only the primary family is imported.
  const css = await savedStylesheet(page).textContent();
  expect(css).toContain("font-family: 'Lora'");
  expect(css).not.toContain("font-family: 'Playfair Display'");
  expect(css).not.toContain("font-family: 'Georgia'");
});
