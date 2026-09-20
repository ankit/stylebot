import { test, expect } from './fixtures';
import { PAGE_URL, openEditor, pickElement, servePage } from './helpers';

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
  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);

  await pickElement(page, editorRoot, 'h1');

  // A freshly picked element with no existing declarations auto-expands the
  // Text panel, which now hosts the text-color picker (see TheTextProperties.vue).
  const colorInput = editorRoot.locator('.color-picker .color-hex').first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});
