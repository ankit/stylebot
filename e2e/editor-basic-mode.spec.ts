import { test, expect } from './fixtures';
import { openEditor } from './helpers';

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

test('picking an element and editing a color in basic mode applies live and persists', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);

  // openStylebot starts in inspecting mode already, so no extra click is
  // needed before picking an element on the page.
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);
  await page.locator('h1').click({ force: true });
  await expect(editorRoot.locator('.css-selector-input')).toHaveValue(/h1$/);

  await editorRoot.getByRole('button', { name: 'Colors', exact: true }).click();

  const colorInput = editorRoot
    .locator('.color-picker .color-text-input')
    .first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});
