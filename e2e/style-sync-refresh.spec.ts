import { test, expect } from './fixtures';
import {
  seedStyles,
  openEditor,
  switchEditorMode,
  getMonacoFrame,
} from './helpers';

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

// Regression test for #751: a sync pull replaces the style map wholesale, and
// the editor open on that page used to keep showing what it had loaded — its
// next keystroke then saved the stale CSS back over what was just pulled.
test('an open code editor picks up styles replaced behind it', async ({
  context,
  extension,
  openPopup,
}) => {
  test.slow();

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto('http://localhost/');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await expect(monaco.locator('.view-lines')).toContainText('255, 0, 128');

  // SetAllStyles is what a sync pull goes through: it replaces the map and
  // fans ApplyStylesToTab out to every open tab.
  const popup = await openPopup();
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({
      name: 'SetAllStyles',
      styles: {
        localhost: {
          css: 'h1 { color: rgb(0, 128, 255); }',
          enabled: true,
          readability: false,
          modifiedTime: new Date().toISOString(),
        },
      },
    });
  });

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 255)');
  await expect(monaco.locator('.view-lines')).toContainText('0, 128, 255');

  // A pull can also remove the style being edited outright.
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({ name: 'SetAllStyles', styles: {} });
  });

  await expect(page.locator('h1')).not.toHaveCSS('color', 'rgb(0, 128, 255)');
  await expect(monaco.locator('.view-lines')).not.toContainText('0, 128, 255');
});
