import { test, expect } from './fixtures';

test('CSS code editor offers property autocomplete and color swatches', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/monaco-editor/iframe/index.html`);

  await page.waitForFunction(() => Boolean((window as any).monaco));
  await page.click('#container');

  await page.keyboard.type('a { disp');
  await expect(page.locator('.suggest-widget.visible')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.keyboard.type('lay: none; color: red; }');
  await page.keyboard.press('Escape');

  await expect(page.locator('.colorpicker-color-decoration')).toBeVisible();
});
