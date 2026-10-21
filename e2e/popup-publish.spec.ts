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

test("a profile's Publish to Gallery in the popup opens the editor on that profile's publish view", async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: {
      css: 'h1 { color: red; }',
      enabled: true,
      profiles: {
        default: { name: '' },
        dark: { name: 'Dark', css: 'h1 { color: blue; }' },
      },
      activeProfile: 'default',
    },
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await page.bringToFront();

  const popup = await openPopup();
  await waitForEditorListener(popup);

  const row = popup.locator('.profile-row', { hasText: 'Dark' });
  await row.locator('button[aria-label="Profile actions"]').click();
  await row
    .locator('[role="menuitem"]', { hasText: 'Publish to Gallery' })
    .click();

  const editor = page.locator('#stylebot');
  await expect(
    editor.getByRole('button', { name: 'Sign in with Google to publish' })
  ).toBeVisible();
  await expect(editor.getByRole('textbox', { name: 'Name' })).toHaveValue(
    'Dark'
  );
  await expect(page.locator('body > h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});
