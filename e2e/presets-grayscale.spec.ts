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

// Hacker News wraps its page in a bare <center>, giving the filter no class or
// id to hang off.
const UNIDENTIFIED_PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <center><table id="hnmain"><tr><td>Test page</td></tr></table></center>
    </body>
  </html>
`;

test('taking grayscale back to 0 keeps the rest of the rule in the saved style', async ({
  context,
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
  // Under load the second click can land before the switch has re-rendered as
  // checked, so wait for it — a click on a still-unchecked switch turns it on again.
  await expect(toggle).toBeChecked();

  await toggle.click({ force: true });
  await expect(article).toHaveCSS('filter', 'none');
  await expect(toggle).not.toBeChecked();

  // The colour has to outlive the filter both live and in the persisted style.
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');

  await page.reload();
  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect(article).toHaveCSS('filter', 'none');
});

test('grayscale applies on a page whose body child has no class or id', async ({
  context,
  openPopup,
}) => {
  test.slow();

  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: UNIDENTIFIED_PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const wrapper = page.locator('center');
  const editorRoot = await openEditor(page, openPopup);

  await switchEditorMode(editorRoot, 'presets');

  const grayscaleCard = page.locator('.feature-card').filter({
    has: page.locator('h3', { hasText: /^Grayscale$/ }),
  });
  const toggle = grayscaleCard.locator('.switch input[type="checkbox"]');

  await toggle.click({ force: true });
  await expect(wrapper).toHaveCSS('filter', 'grayscale(1)');
  // Under load the second click can land before the switch has re-rendered as
  // checked, so wait for it — a click on a still-unchecked switch turns it on again.
  await expect(toggle).toBeChecked();

  await toggle.click({ force: true });
  await expect(wrapper).toHaveCSS('filter', 'none');
  await expect(toggle).not.toBeChecked();
});
