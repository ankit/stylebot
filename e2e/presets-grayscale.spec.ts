import { test, expect } from './fixtures';
import { openEditor, switchEditorMode } from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

// The filter effect attaches to body's element children, so the styled element
// has to be one of them for grayscale to land on the user's own rule.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <div class="article-body">Test page</div>
    </body>
  </html>
`;

test('taking grayscale back to 0 keeps the rest of the rule in the saved style', async ({
  context,
  extensionId: _extensionId,
  openPopup,
}) => {
  test.slow();

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const article = page.locator('div.article-body');
  const editorRoot = await openEditor(page, openPopup);

  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);
  await article.click({ force: true });
  await expect(
    editorRoot.locator('.autocomplete-chips .chip').first()
  ).toHaveText('div.article-body');

  // A freshly picked element with no existing declarations auto-expands the
  // Text panel, which hosts the text-color picker (see TheTextProperties.vue).
  const colorInput = editorRoot.locator('.color-picker .color-hex').first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');

  await switchEditorMode(editorRoot, 'presets');

  // page-scoped, not editorRoot-scoped: see e2e/color-picker.spec.ts.
  const grayscaleCard = page.locator('.feature-card').filter({
    has: page.locator('h3', { hasText: /^Grayscale$/ }),
  });
  const toggle = grayscaleCard.locator('.switch input[type="checkbox"]');

  // Switching the preset on applies the last-used percentage (100 by default);
  // switching it off takes grayscale back to 0.
  await toggle.click({ force: true });
  await expect(article).toHaveCSS('filter', 'grayscale(1)');

  await toggle.click({ force: true });
  await expect(article).toHaveCSS('filter', 'none');

  // The colour has to outlive the filter both live and in the persisted style.
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(article).toHaveCSS('filter', 'none');
});
