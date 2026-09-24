import { test, expect } from './fixtures';
import {
  PAGE_URL,
  getMonacoFrame,
  openEditor,
  servePage,
  switchEditorMode,
} from './helpers';

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
  // Loading Monaco in an iframe is the heaviest thing the suite does.
  test.slow();

  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await monaco.locator('.monaco-editor').click();
  await page.keyboard.type('h1 { color: rgb(255, 0, 128); }');

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
});

test('toggling the panel appearance updates the Monaco editor theme immediately', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  // Firefox lacks the EditContext API, so Monaco falls back to a textarea
  // whose cover element also carries .monaco-editor-background.
  const monacoBackground = getMonacoFrame(page).locator(
    '.lines-content.monaco-editor-background'
  );
  await expect(monacoBackground).toBeVisible();

  // The trigger's label lives in a hover/focus-only STooltip, not an
  // accessible name, so target it via the anchor's wrapper class instead.
  await editorRoot.locator('.appearance-action-anchor button').click();
  await editorRoot.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(monacoBackground).toHaveCSS(
    'background-color',
    'rgb(30, 30, 30)'
  );

  // No reload here — the editor iframe stays mounted throughout.
  await editorRoot.locator('.appearance-action-anchor button').click();
  await editorRoot.getByRole('menuitem', { name: 'Light' }).click();

  await expect(monacoBackground).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)'
  );
});

test('Tab indents in the code editor, Escape leaves it, and a second Escape closes the panel', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  const editor = monaco.locator('.monaco-editor');
  await editor.click();
  await page.keyboard.press('Tab');
  await page.keyboard.type('h1 { color: rgb(0, 0, 255); }');

  await expect
    .poll(() =>
      editor.evaluate(() => {
        const { monaco } = window as Window & {
          monaco: { editor: { getModels(): Array<{ getValue(): string }> } };
        };

        return monaco.editor.getModels()[0].getValue();
      })
    )
    .toBe('  h1 { color: rgb(0, 0, 255); }');

  await page.keyboard.press('Escape');

  const codeEditor = editorRoot.locator('.stylebot-code-editor-iframe');
  await expect(codeEditor).toBeFocused();
  expect(await codeEditor.evaluate(el => el.matches(':focus-visible'))).toBe(
    true
  );
  await expect(editorRoot.locator('.stylebot-content')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(editorRoot.locator('.stylebot-content')).toBeHidden();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});

test('typing a CSS property offers autocomplete and a color value shows a swatch', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await monaco.locator('.monaco-editor').click();
  await page.keyboard.type('h1 { disp');

  await expect(monaco.locator('.suggest-widget.visible')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.keyboard.type('lay: none; color: red; }');

  await expect(monaco.locator('.colorpicker-color-decoration')).toBeVisible();
});

test('native CSS nesting gets no error markers, keeps autocomplete inside the nested block, and applies (#782)', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await servePage(
    context,
    `
      <!doctype html>
      <html>
        <body>
          <h1>Test page</h1>
          <p>Paragraph</p>
        </body>
      </html>
    `
  );

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  const editor = monaco.locator('.monaco-editor');
  const countMarkers = () =>
    editor.evaluate(() => {
      const { monaco } = window as Window & {
        monaco: { editor: { getModelMarkers(filter: object): Array<unknown> } };
      };

      return monaco.editor.getModelMarkers({}).length;
    });

  await editor.click();

  // A real mistake first, proving the language service is validating at all
  // before relying on it reporting nothing for the nested syntax.
  await page.keyboard.type('h1 { color: ; }');
  await expect.poll(countMarkers).toBeGreaterThan(0);

  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('h1 { color: rgb(0, 0, 255); & + p { col');

  await expect(monaco.locator('.suggest-widget.visible')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.type(
    'or: rgb(0, 128, 0); } @media (min-width: 1px) { font-style: italic; } }'
  );

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(page.locator('h1')).toHaveCSS('font-style', 'italic');
  await expect(page.locator('body > p')).toHaveCSS('color', 'rgb(0, 128, 0)');
  await expect.poll(countMarkers).toBe(0);
});
