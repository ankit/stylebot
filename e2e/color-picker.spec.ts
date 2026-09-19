import { test, expect } from './fixtures';
import { openEditor } from './helpers';

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

test('falls back to page colors, then switches to already-used colors once a rule is set', async ({
  context,
  openPopup,
}, testInfo) => {
  // More sequential UI steps than the other specs (autocomplete, popover,
  // reopen) — give it more headroom under parallel-worker CPU contention.
  testInfo.setTimeout(60_000);

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

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
  const firstTab = popover.locator('.tabs .tab').first();

  // No Stylebot rule exists for this site yet, so the first tab falls back
  // to the live page's own colors rather than showing empty/disabled.
  await expect(firstTab).toHaveText('Page colors');
  await expect(firstTab).toHaveClass(/active/);
  await expect(popover.locator('.first-tab .swatch').first()).toBeVisible();

  const supportsEyeDropper = await page.evaluate(
    () => typeof window.EyeDropper !== 'undefined'
  );
  const pickButton = popover.locator('.pick');
  if (supportsEyeDropper) {
    await expect(pickButton).toBeVisible();
  } else {
    await expect(pickButton).toHaveCount(0);
  }

  // Set a color via the shared hex/rgb footer field (present on every tab) —
  // this both proves the footer applies a real style, and gives us a known
  // "already used" color to look for once the tab flips over.
  const valueField = popover.locator('.value-field');
  await valueField.fill('#112233');
  await valueField.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(17, 34, 51)');

  // Close and reopen the popover — the just-applied rule means state.css is
  // no longer empty, so the first tab should now read from it instead.
  await swatch.click();
  await swatch.click();

  await expect(firstTab).toHaveText('Your colors');
  await expect(
    popover.locator('.used-colors .swatch[style*="17, 34, 51"]')
  ).toBeVisible();

  // The just-applied color was also the one the popover closed on, so it
  // should be recorded in Recent — now shown in this same tab, not Custom.
  await expect(popover.locator('.recent-section')).toBeVisible();
  await expect(
    popover.locator('.recent-section .swatch[style*="17, 34, 51"]')
  ).toBeVisible();
});

test('the palette search lists every palette again from the chevron, even after a dead-end query', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  await openEditor(page, openPopup);
  await page.getByPlaceholder('Pick an element').fill('h1');

  const textCard = page.locator('.property-card').filter({
    has: page.locator('.property-card-label', { hasText: /^Text$/ }),
  });
  await textCard.locator('.color-swatch').click();

  const popover = page.locator('.color-picker-popover');
  await popover.locator('.tabs .tab', { hasText: 'Palette' }).click();

  const search = popover.locator('.palette-search');
  const input = search.locator('.autocomplete-input');
  const activeLabel = await input.inputValue();

  // Escape on an open list restores the active palette's name...
  await input.click();
  await input.fill(activeLabel.slice(0, 3));
  await expect(popover.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue(activeLabel);

  // ...and a query that matches nothing closes the list, but the chevron
  // still lists every palette without touching the text.
  await input.fill('zzz');
  await expect(popover.getByRole('menu')).toHaveCount(0);
  await search.locator('.autocomplete-chevron').click();
  await expect(popover.getByRole('menu')).toBeVisible();
  await expect(input).toHaveValue('zzz');
  expect(await popover.getByRole('menuitem').count()).toBeGreaterThan(1);
});
