import { test, expect } from './fixtures';

test.skip(
  ({ engine }) => !engine.opensExtensionPages,
  "Playwright can't open the options page as a page on this engine"
);

test('Tab indents in the options code editor and Escape hands Tab back to the page', async ({
  context,
  extension,
}) => {
  const page = await context.newPage();
  await page.goto(
    `chrome-extension://${extension.id}/options.html#/styles/edit`
  );

  const monaco = page.frameLocator('.stylebot-code-editor-iframe iframe');
  const editor = monaco.locator('.monaco-editor');
  await editor.click();
  await page.keyboard.press('Tab');
  await page.keyboard.type('h1 { color: blue; }');

  await expect
    .poll(() =>
      editor.evaluate(() => {
        const { monaco } = window as Window & {
          monaco: { editor: { getModels(): Array<{ getValue(): string }> } };
        };

        return monaco.editor.getModels()[0].getValue();
      })
    )
    .toBe('  h1 { color: blue; }');

  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');

  await expect(
    page.getByRole('button', { name: 'Discard changes' })
  ).toBeFocused();
});
