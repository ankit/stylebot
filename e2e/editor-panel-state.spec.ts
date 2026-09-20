import { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { openEditor, pickElement } from './helpers';

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

// page-scoped, not editorRoot-scoped: see the note in color-picker.spec.ts
// about .filter({ has }) across the #stylebot shadow root.
const card = (page: Page, label: string) =>
  page.locator('.property-card').filter({
    has: page.locator('.property-card-label', {
      hasText: new RegExp(`^${label}$`),
    }),
  });

const collapse = (page: Page, label: string) =>
  card(page, label).locator('.property-card-collapse');

// How the opened panels follow element picks is covered by the Storybook
// interaction tests; this only proves the preference survives a reload.
test('a manually opened panel stays open across reloads', async ({
  context,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );

  const page = await context.newPage();
  await page.goto('http://localhost/');

  let editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');

  // Nothing is styled yet, so only Text auto-expands.
  await expect(collapse(page, 'Box')).toHaveClass(/collapsed/);

  await card(page, 'Box').locator('.property-card-header').click();
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);

  await page.reload();
  editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);
});
