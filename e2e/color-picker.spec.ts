import { test, expect } from './fixtures';
import { PAGE_URL, openEditor, servePage } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head></head>
    <body style="background: #eeeeee;">
      <h1 style="color: #3355ff;">Test page</h1>
      <p style="color: #008800;">Some text</p>
    </body>
  </html>
`;

// The popover's tabs, swatches and palette search are covered by the
// Storybook interaction tests; this proves the footer field styles the page
// and that the picked color round-trips through the background's history.
test('a color picked in the popover applies to the page and is remembered as recent', async ({
  context,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  await openEditor(page, openPopup);

  // Enables the (otherwise disabled) property fields — ColorPicker.vue reads
  // `activeSelector` to gate itself, same as every other property control.
  await page.getByPlaceholder('Pick an element').fill('h1');

  // page-scoped, not editorRoot-scoped: chaining .filter({ has }) off a
  // locator that's already pierced the #stylebot shadow root once breaks
  // the containment check across that boundary a second time.
  const textCard = page.locator('.property-card').filter({
    has: page.locator('.property-card-label', { hasText: /^Text$/ }),
  });
  const swatch = textCard.locator('.color-swatch');

  await swatch.click();

  const popover = page.locator('.color-picker-popover');
  const valueField = popover.locator('.value-field');
  await valueField.fill('#112233');
  await valueField.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(17, 34, 51)');

  // The color the popover closed on is recorded as recent by the background
  // and read back when it reopens.
  await swatch.click();
  await swatch.click();

  await expect(
    popover.locator('.recent-section .swatch[style*="17, 34, 51"]')
  ).toBeVisible();
});
