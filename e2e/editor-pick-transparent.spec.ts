import { test, expect } from './fixtures';
import { openEditor, startTestServer } from './helpers';

// A menu button drawn as a label with an invisible checkbox laid over it,
// the way Wikipedia builds its dropdown toggles.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <div style="position: relative; width: 120px; height: 40px">
        <span class="menu-label">Menu</span>
        <input
          type="checkbox"
          class="menu-checkbox"
          style="position: absolute; inset: 0; margin: 0; width: 100%; height: 100%; opacity: 0"
        />
      </div>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

test('clicking a fully transparent control picks the visible element under it', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);

  const label = await page.locator('.menu-label').boundingBox();
  await page.mouse.move(label!.x + 5, label!.y + 5);
  await page.mouse.click(label!.x + 5, label!.y + 5);

  await expect(
    editorRoot.locator('.autocomplete-chips .part').first()
  ).toHaveText(/\.menu-label$/);
});
