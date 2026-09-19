import { test, expect } from './fixtures';
import { openEditor, seedStyles } from './helpers';

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
  await expect(
    editorRoot.locator('.autocomplete-chips .chip').first()
  ).toHaveText(/h1$/);

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

test('arrow keys return from the selector suggestions to the selector field', async ({
  context,
  extension,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );
  // Suggestions are the page's existing selectors, so seed a couple.
  await seedStyles(extension, {
    localhost: {
      css: 'h1 { color: red; }\n\np { color: blue; }',
      enabled: true,
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);

  const selector = editorRoot.locator('.selector-autocomplete');
  const input = selector.locator('.autocomplete-input');
  await page.locator('h1').click({ force: true });
  const chips = selector.locator('.autocomplete-chips');
  await expect(chips.locator('.chip').first()).toHaveText(/h1$/);

  // The chips are a tab stop that hands focus to the input.
  await chips.evaluate(el => (el as HTMLElement).focus());
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(editorRoot.getByRole('menu')).toHaveCount(0);

  // The chevron focuses the field, keeps its value and lists every selector.
  await selector.locator('.autocomplete-chevron').click();
  await expect(editorRoot.getByRole('menu')).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(/h1$/);
  await expect(editorRoot.locator('.css-selector-dropdown-item')).toHaveCount(
    2
  );

  await page.keyboard.press('ArrowDown');
  await expect(
    editorRoot.locator('.css-selector-dropdown-item').first()
  ).toBeFocused();

  await page.keyboard.press('ArrowUp');
  await expect(input).toBeFocused();
  await expect(editorRoot.getByRole('menu')).toBeVisible();

  // Escape closes the list and leaves the selector as it was.
  await page.keyboard.press('Escape');
  await expect(editorRoot.getByRole('menu')).toHaveCount(0);
  await expect(input).toHaveValue(/h1$/);
  await expect(editorRoot.locator('.stylebot-content')).toHaveCount(1);
});
