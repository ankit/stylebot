import { test, expect } from './fixtures';
import { openEditor, PAGE_URL, seedStyles, servePage } from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>body h1 { color: rgb(255, 0, 0); }</style>
    </head>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

// The switch itself is covered by the Storybook interaction tests; this
// proves the choice reaches storage and holds across a reload.
test('turning off Override site styles applies the style as written and persists it', async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(0, 0, 255); }', enabled: true },
  });

  const page = await context.newPage();
  const h1 = page.locator('h1');
  await page.goto(PAGE_URL);

  // Forced, the less specific rule beats the page's `body h1`.
  await expect(h1).toHaveCSS('color', 'rgb(0, 0, 255)');

  const editorRoot = await openEditor(page, openPopup);
  await editorRoot.getByRole('button', { name: 'Options' }).click();

  const toggle = editorRoot.getByRole('checkbox', {
    name: 'Override site styles',
  });
  await expect(toggle).toBeChecked();
  await toggle.locator('xpath=..').click();
  await expect(toggle).not.toBeChecked();

  await expect(h1).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect
    .poll(() =>
      extension.evaluate(async () => {
        const { styles } = await chrome.storage.local.get('styles');
        return styles.localhost.forceImportant;
      })
    )
    .toBe(false);

  await page.reload();
  await expect(h1).toHaveCSS('color', 'rgb(255, 0, 0)');
});
