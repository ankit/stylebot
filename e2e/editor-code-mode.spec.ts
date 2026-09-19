import { test, expect } from './fixtures';
import { openEditor, switchEditorMode, getMonacoFrame } from './helpers';

// Loading Monaco in an iframe is CPU-heavy and can starve the popup's own
// tab under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

test('typing CSS into the code-mode Monaco editor applies live and persists', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await monaco.locator('.monaco-editor').click();
  await page.keyboard.type('h1 { color: rgb(255, 0, 128); }');

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});

test('typing a CSS property offers autocomplete and a color value shows a swatch', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await monaco.locator('.monaco-editor').click();
  await page.keyboard.type('h1 { disp');

  await expect(monaco.locator('.suggest-widget.visible')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.keyboard.type('lay: none; color: red; }');
  await page.keyboard.press('Escape');

  await expect(monaco.locator('.colorpicker-color-decoration')).toBeVisible();
});
