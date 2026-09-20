import { test, expect } from './fixtures';
import { openEditor, startTestServer } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML });
});

test.afterAll(() => server.close());

test('opening Stylebot from the popup opens the editor in the current tab', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(server.baseUrl);

  // init-editor.ts mounts the editor under this host once ToggleStylebot reaches it.
  await expect(page.locator('#stylebot')).toHaveCount(0);

  // The host is deliberately 0x0 (see init-editor.ts) — assert presence, not visibility.
  const editorRoot = await openEditor(page, openPopup);
  await expect(editorRoot).toBeAttached();
});
