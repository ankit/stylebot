import { test, expect } from './fixtures';
import { PAGE_URL, openEditor, servePage } from './helpers';

// Like GitHub's hotkeys: single keys pressed outside a field are taken as
// shortcuts and swallowed.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
      <script>
        window.shortcuts = [];
        document.addEventListener('keydown', event => {
          const target = event.target;
          if (target.matches('input, textarea, select, [contenteditable]')) {
            return;
          }
          window.shortcuts.push(event.key);
          event.preventDefault();
        });
      </script>
    </body>
  </html>
`;

test("typing in the panel's fields doesn't trigger the page's shortcuts", async ({
  context,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  const field = editorRoot.locator('.autocomplete-input').first();

  await field.click();
  await page.keyboard.type('gst');

  await expect(field).toHaveValue('gst');
  expect(
    await page.evaluate(
      () => (window as unknown as { shortcuts: Array<string> }).shortcuts
    )
  ).toEqual([]);
});
