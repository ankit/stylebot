import { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { openEditor, pickElement, seedStyles } from './helpers';

// Editor-open depends on a popup tab-messaging round trip, which can lag
// under a full parallel worker fleet (see e2e/readability.spec.ts).
test.describe.configure({ retries: 2 });

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
      <blockquote>Some text</blockquote>
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

// Picking an element leaves inspecting mode, so re-enter it before picking
// the next one.
const pickNext = async (page: Page, editorRoot: Locator, selector: string) => {
  await editorRoot.locator('.stylebot-inspector').click();
  await pickElement(page, editorRoot, selector);
};

test('a manually opened panel stays open across element picks and reloads', async ({
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
  await expect(collapse(page, 'Text')).not.toHaveClass(/collapsed/);
  await expect(collapse(page, 'Box')).toHaveClass(/collapsed/);

  await card(page, 'Box').locator('.property-card-header').click();
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);

  await pickNext(page, editorRoot, 'blockquote');
  await expect(collapse(page, 'Text')).not.toHaveClass(/collapsed/);
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);

  await page.reload();
  editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);

  // Closing it by hand forgets it again.
  await card(page, 'Box').locator('.property-card-header').click();
  await expect(collapse(page, 'Box')).toHaveClass(/collapsed/);

  await pickNext(page, editorRoot, 'blockquote');
  await expect(collapse(page, 'Box')).toHaveClass(/collapsed/);
});

test('panels with declarations still auto-expand and collapse per element', async ({
  context,
  extension,
  openPopup,
}) => {
  await context.route('http://localhost/**', route =>
    route.fulfill({ contentType: 'text/html', body: PAGE_HTML })
  );
  await seedStyles(extension, {
    localhost: { css: 'h1 { margin: 10px; }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto('http://localhost/');

  const editorRoot = await openEditor(page, openPopup);
  await pickElement(page, editorRoot, 'h1');
  await expect(collapse(page, 'Box')).not.toHaveClass(/collapsed/);
  await expect(collapse(page, 'Text')).toHaveClass(/collapsed/);

  await pickNext(page, editorRoot, 'blockquote');
  await expect(collapse(page, 'Box')).toHaveClass(/collapsed/);
  await expect(collapse(page, 'Text')).not.toHaveClass(/collapsed/);
});
