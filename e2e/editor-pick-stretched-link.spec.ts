import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { openEditor, startTestServer } from './helpers';

// A story card whose headline link stretches a ::before over the whole card,
// the way the New York Times makes its cards clickable.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>
        .card { position: relative; width: 400px; }
        .card-link::before {
          content: '';
          position: absolute;
          inset: 0;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h3><a class="card-link" href="#">Headline</a></h3>
        <p class="card-summary">Summary of the story below the headline.</p>
      </div>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

const pickAt = async (page: Page, selector: string): Promise<void> => {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + 5);
  await page.mouse.click(box!.x + 5, box!.y + 5);
};

test('picking under a link stretched over its card picks what is there', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  await pickAt(page, '.card-summary');

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.card-summary$/);
});

test('picking the headline itself still picks its link', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  await pickAt(page, '.card-link');

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.card-link$/);
});
