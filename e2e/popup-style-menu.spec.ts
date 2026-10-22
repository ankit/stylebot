import { test, expect } from './fixtures';
import {
  PAGE_URL,
  seedStyles,
  servePage,
  waitForEditorListener,
} from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

test("deleting a site's only style from the popup's menu takes it off the page", async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(0, 0, 255); }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
  await page.bringToFront();

  const popup = await openPopup();
  await waitForEditorListener(popup);

  await popup.locator('button[aria-label="Profile actions"]').click();
  await popup.locator('[role="menuitem"]', { hasText: 'Delete' }).click();
  await popup.locator('.confirm button', { hasText: 'Delete' }).click();

  await expect(page.locator('h1')).not.toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect
    .poll(() =>
      popup.evaluate(async () => {
        const { styles } = await chrome.storage.local.get('styles');

        return Object.keys(styles ?? {});
      })
    )
    .toEqual([]);
});
