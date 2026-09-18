import { test, expect } from './fixtures';

test('popup mounts and renders the open-editor toggle', async ({
  context,
  openPopup,
}) => {
  // A real page must be the active tab first — otherwise the popup's own
  // chrome-extension:// tab becomes "the current tab" and it renders the
  // restricted-page state instead of the toggle.
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.bringToFront();

  const popup = await openPopup();

  // Proves the popup's Vue app mounts without throwing — the direct symptom
  // of the "won't open" bug cluster is a blank or broken popup here.
  await expect(
    popup.getByRole('button', { name: /^Style this page/ })
  ).toBeVisible();
});
