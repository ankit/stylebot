import { test, expect } from './fixtures';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { openEditor, startTestServer } from './helpers';

// Story cards whose headline link stretches a ::before over the whole card,
// the way the New York Times makes its cards clickable.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>
        .card { position: relative; width: 400px; margin-bottom: 40px; }
        .card a::before {
          content: '';
          position: absolute;
          inset: 0;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>
          <a class="card-link" href="#">
            <div><p class="card-title">Headline</p></div>
          </a>
        </h3>
        <p class="card-summary">Summary of the story below the headline.</p>
      </div>
      <div class="card">
        <h3><a class="plain-link" href="#">Plain headline</a></h3>
        <p>Another summary.</p>
      </div>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

const openInspector = async (
  context: BrowserContext,
  openPopup: Parameters<typeof openEditor>[1]
): Promise<{ page: Page; editorRoot: Locator }> => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  return { page, editorRoot };
};

const moveTo = async (page: Page, selector: string): Promise<void> => {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + 5);
};

const pickAt = async (page: Page, selector: string): Promise<void> => {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + 5);
  await page.mouse.click(box!.x + 5, box!.y + 5);
};

const pickedSelector = (editorRoot: Locator): Locator =>
  editorRoot.locator('.autocomplete-chips .part').first();

test('picking under a link stretched over its card picks what is there', async ({
  context,
  openPopup,
}) => {
  const { page, editorRoot } = await openInspector(context, openPopup);

  await pickAt(page, '.card-summary');

  await expect(pickedSelector(editorRoot)).toHaveText(/\.card-summary$/);
});

test('picking the headline picks the text inside its link', async ({
  context,
  openPopup,
}) => {
  const { page, editorRoot } = await openInspector(context, openPopup);

  await pickAt(page, '.card-title');

  await expect(pickedSelector(editorRoot)).toHaveText(/\.card-title$/);
});

test('picking a headline link with only text picks the link', async ({
  context,
  openPopup,
}) => {
  const { page, editorRoot } = await openInspector(context, openPopup);

  await pickAt(page, '.plain-link');

  await expect(pickedSelector(editorRoot)).toHaveText(/\.plain-link$/);
});

test('moving from the headline down onto the summary follows the pointer', async ({
  context,
  openPopup,
}) => {
  const { page, editorRoot } = await openInspector(context, openPopup);

  await moveTo(page, '.card-title');
  await pickAt(page, '.card-summary');

  await expect(pickedSelector(editorRoot)).toHaveText(/\.card-summary$/);
});
