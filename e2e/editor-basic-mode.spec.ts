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
  extensionId: _extensionId,
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
  await expect(editorRoot.locator('.autocomplete-chips .chip').first()).toHaveText(/h1$/);

  // A freshly picked element with no existing declarations auto-expands the
  // Text panel, which now hosts the text-color picker (see TheTextProperties.vue).
  const colorInput = editorRoot.locator('.color-picker .color-hex').first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});

test('Escape closes an open header dropdown instead of the whole editor', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);

  await editorRoot.getByRole('button', { name: 'Options' }).click();
  const menu = editorRoot.locator('.more-menu');
  await expect(menu).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  // The editor itself must stay open — only the dropdown should have closed.
  await expect(editorRoot.locator('.stylebot-content')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(editorRoot.locator('.stylebot-content')).toHaveCount(0);
});
