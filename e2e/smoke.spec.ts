import { test, expect } from './fixtures';

test('reveals the page after the content script runs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://example.com');

  // hide-page.ts adds this at document_start, removes it once storage resolves.
  // A leftover element means the reveal hung — the load white flash bug.
  await expect(page.locator('#stylebot-hide-page')).toHaveCount(0);
});

test('popup mounts and renders the open-editor toggle', async ({ context, openPopup }) => {
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
