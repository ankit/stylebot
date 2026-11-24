import { test, expect } from './fixtures';
import { openEditor, startTestServer } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Article</h1>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

test('a page wall at the highest z-index, added after the editor opens, stays below the panel and the inspector', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  // Like an ad-block notice: a full-page backdrop holding the message.
  await page.evaluate(() => {
    const backdrop = document.createElement('div');
    backdrop.style.cssText =
      'position: fixed; inset: 0; z-index: 2147483647; background: rgb(0 0 0 / 40%)';
    backdrop.innerHTML =
      '<h2 class="wall-heading" style="margin: 100px; background: white">Your support matters</h2>';
    document.body.appendChild(backdrop);
  });

  const heading = await page.locator('.wall-heading').boundingBox();
  await page.mouse.move(heading!.x + 10, heading!.y + 10);

  await expect(
    page
      .locator('#stylebot-overlay, #stylebot')
      .evaluateAll(layers =>
        layers.map(layer => layer.matches(':popover-open'))
      )
  ).resolves.toEqual([true, true]);

  await page.mouse.click(heading!.x + 10, heading!.y + 10);

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.wall-heading$/);

  const codeTab = editorRoot.getByRole('tab', { name: 'Code' });
  await codeTab.click();
  await expect(codeTab).toHaveAttribute('aria-selected', 'true');
});
