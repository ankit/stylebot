import { test, expect } from './fixtures';

test('reveals the page after the content script runs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://example.com');

  // hide-page.ts adds this at document_start, removes it once storage resolves.
  // A leftover element means the reveal hung — the load white flash bug.
  await expect(page.locator('#stylebot-hide-page')).toHaveCount(0);
});
