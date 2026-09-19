import type { Locator } from '@playwright/test';

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

const setRangeValue = (slider: Locator, value: string): Promise<void> =>
  slider.evaluate((el, next) => {
    (el as HTMLInputElement).value = next;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);

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
  await expect(editorRoot.locator('.css-selector-input')).toHaveValue(
    'div.article-body'
  );

  await editorRoot.getByRole('button', { name: 'Colors', exact: true }).click();

  const colorInput = editorRoot
    .locator('.color-picker .color-text-input')
    .first();
  await colorInput.fill('#ff0080');
  await colorInput.blur();

  await expect(article).toHaveCSS('color', 'rgb(255, 0, 128)');

  await switchEditorMode(editorRoot, 'magic');
  const slider = editorRoot.locator('input[type="range"]');
  await slider.waitFor({ state: 'attached' });

  await setRangeValue(slider, '100');
  await expect(article).toHaveCSS('filter', 'grayscale(1)');

  await setRangeValue(slider, '0');
  await expect(article).toHaveCSS('filter', 'none');

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

  await switchEditorMode(editorRoot, 'magic');
  const slider = editorRoot.locator('input[type="range"]');
  await slider.waitFor({ state: 'attached' });

  await setRangeValue(slider, '100');
  await expect(wrapper).toHaveCSS('filter', 'grayscale(1)');

  await setRangeValue(slider, '0');
  await expect(wrapper).toHaveCSS('filter', 'none');
});
