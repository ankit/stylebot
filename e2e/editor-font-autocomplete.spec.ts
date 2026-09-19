import type { BrowserContext, Locator, Page } from '@playwright/test';
import { test, expect, type Extension, type Popup } from './fixtures';
import { openEditor, pickElement, seedStyles } from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const GOOGLE_FONTS = ['Playfair Display', 'Lora', 'Merriweather'];

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
): Promise<{ page: Page; editorRoot: Locator; font: Locator }> => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );
  // Like the real endpoint, unknown families answer 400.
  await context.route('https://fonts.googleapis.com/**', route => {
    const family = requestedFamily(route.request().url());

    return GOOGLE_FONTS.includes(family)
      ? route.fulfill({ contentType: 'text/css', body: fontFaceFor(family) })
      : route.fulfill({ status: 400, body: '' });
  });

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');

  // page-scoped, not editorRoot-scoped: see e2e/color-picker.spec.ts.
  return { page, editorRoot, font: page.locator('.font-family-autocomplete') };
};

// Focusing the field opens the menu; with a value set it renders as chips
// until clicked, and the revealed input starts fully selected.
const openPicker = async (font: Locator): Promise<Locator> => {
  const chips = font.locator('.autocomplete-chips');

  if (await chips.count()) {
    await chips.click();
  } else {
    await font.locator('.autocomplete-input').click();
  }

  const input = font.locator('.autocomplete-input');
  await expect(input).toBeFocused();
  return input;
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

const readRecentFonts = (extension: Extension) =>
  extension.evaluate(async () => {
    const { options } = await chrome.storage.local.get('options');
    return options?.fonts as Array<string> | undefined;
  });

test('typing suggests Google Fonts; picking one applies it, imports it, and remembers it', async ({
  context,
  extension,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('playf');

  await expect(
    menuItem(page, 'Playfair Display').locator('.font-row-category')
  ).toHaveText('serif');

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Playfair Display/);
  await expect(font.locator('.autocomplete-chips .chip')).toHaveText(
    'Playfair Display'
  );

  const stylesheet = savedStylesheet(page);
  await expect.poll(() => stylesheet.textContent()).toContain('@font-face');
  await expect.poll(() => stylesheet.textContent()).toContain('Playfair');
  await expect.poll(() => previewCss(page)).toBe('');

  // The chevron opens the picker like a click on the field: focused, value
  // kept (and selected), recents shown.
  await font.locator('.autocomplete-chevron').click();
  const input = font.locator('.autocomplete-input');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Playfair Display');
  expect(
    await input.evaluate(el => {
      const { selectionStart, selectionEnd, value } = el as HTMLTextAreaElement;
      return selectionStart === 0 && selectionEnd === value.length;
    })
  ).toBe(true);
  const items = page.getByRole('menuitem');
  await expect(items.nth(0)).toHaveText('Default');
  await expect(items.nth(1)).toContainText('Playfair Display');
  await expect(items.last()).toHaveText('Browse Google Fonts');

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
  await expect(menuItem(page, 'Use "Nonexistent Font"')).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page.locator('h1')).toHaveCSS('font-family', /Nonexistent Font/);
  await expect
    .poll(() => savedStylesheet(page).textContent())
    .not.toContain('@font-face');
});

test('a category name lists that category, and the browse row opens Google Fonts', async ({
  context,
  openPopup,
}) => {
  await context.route('https://fonts.google.com/**', route =>
    route.fulfill({ contentType: 'text/html', body: '<title>Fonts</title>' })
  );

  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('mono');

  const categories = page.locator('[role=menuitem] .font-row-category');
  await expect(categories.first()).toHaveText('monospace');
  const tags = (await categories.allTextContents()).map(text => text.trim());
  expect(tags.length).toBeGreaterThan(3);
  expect(tags.every(text => text === 'monospace')).toBe(true);

  const opened = context.waitForEvent('page');
  await menuItem(page, 'Browse Google Fonts').click();
  const fontsPage = await opened;
  expect(fontsPage.url()).toMatch(/^https:\/\/fonts\.google\.com/);
  await expect(page.locator('h1')).not.toHaveCSS('font-family', /mono/i);
});

test('arrow keys move between the field and the suggestions', async ({
  context,
  extension,
  openPopup,
}) => {
  const { page, font } = await setup(context, openPopup);
  const input = await openPicker(font);
  await page.keyboard.type('playf');

  await page.keyboard.press('ArrowDown');
  await expect(menuItem(page, 'Playfair Display')).toBeFocused();

  await page.keyboard.press('ArrowUp');
  await expect(input).toBeFocused();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(input).toHaveValue('playf');

  // Editing continues from the end of the text, not from a re-selected value.
  await page.keyboard.type('a');
  await expect(input).toHaveValue('playfa');

  // Up from the field wraps to the last row, Down past it comes back.
  await page.keyboard.press('ArrowUp');
  await expect(menuItem(page, 'Browse Google Fonts')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(input).toBeFocused();

  // Escape only closes the list; the text stays, and reopening with Down
  // keeps the caret rather than re-selecting the text.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(input).toHaveValue('playfa');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.type('i');
  await expect(input).toHaveValue('playfai');

  // Leaving from a row applies the typed text just like leaving from the
  // field, and a half-typed name is applied but not remembered.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(font.locator('.autocomplete-chips .chip')).toHaveText('playfai');
  await expect(page.locator('h1')).toHaveCSS('font-family', /playfai/);
  expect((await readRecentFonts(extension)) ?? []).not.toContain('playfai');
});

test('browsing Google Fonts discards typed text instead of showing it unapplied', async ({
  context,
  openPopup,
}) => {
  await context.route('https://fonts.google.com/**', route =>
    route.fulfill({ contentType: 'text/html', body: '<title>Fonts</title>' })
  );

  const { page, font } = await setup(context, openPopup);

  await openPicker(font);
  await page.keyboard.type('playf');

  const opened = context.waitForEvent('page');
  await menuItem(page, 'Browse Google Fonts').click();
  await opened;

  await expect(font.locator('.autocomplete-chips')).toHaveCount(0);
  await expect(font.locator('.autocomplete-input')).toHaveValue('');
  await expect(page.locator('h1')).not.toHaveCSS('font-family', /playf/);
});

test('escape closes the picker without closing the editor', async ({
  context,
  openPopup,
}) => {
  const { editorRoot, font, page } = await setup(context, openPopup);

  await openPicker(font);
  await expect(page.getByRole('menu')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('menu')).toHaveCount(0);
  // The editor itself must stay open — only the picker should have closed.
  await expect(editorRoot.locator('.stylebot-content')).toHaveCount(1);
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
  const chips = font.locator('.autocomplete-chips .chip');

  // Chips show family names without their CSS quotes.
  await expect(chips).toHaveText(['Playfair Display', 'Georgia', 'serif']);

  const input = await openPicker(font);
  await expect(input).toHaveValue('"Playfair Display", Georgia, serif');
  await page.keyboard.type('Lora');
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveCSS('font-family', 'Lora');
  await expect(chips).toHaveText(['Lora']);

  await openPicker(font);
  // ArrowRight collapses the pre-selected value to its end (End only scrolls on macOS).
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(', Georgia, serif');
  await expect(menuItem(page, 'Use "Lora, Georgia, serif"')).toBeVisible();
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

  const css = await savedStylesheet(page).textContent();
  expect(css).toContain("font-family: 'Lora'");
  expect(css).not.toContain("font-family: 'Playfair Display'");
  expect(css).not.toContain("font-family: 'Georgia'");
});
