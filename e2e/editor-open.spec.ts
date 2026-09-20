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

const RTL_PAGE_HTML = `
  <!doctype html>
  <html dir="rtl">
    <body>
      <h1>صفحة اختبار</h1>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({ '/': PAGE_HTML, '/rtl': RTL_PAGE_HTML });
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

// The panel used to inherit the page's `direction` through the shadow root and
// take its static position from the host's right edge, landing off-screen (#648, #747).
for (const dockLocation of ['left', 'right'] as const) {
  test(`the editor docks ${dockLocation} on an RTL page`, async ({
    context,
    extension,
    openPopup,
  }) => {
    await extension.evaluate(
      location =>
        chrome.storage.local.set({
          options: {
            layout: {
              width: 350,
              adjustPageLayout: true,
              dockLocation: location,
            },
          },
        }),
      dockLocation
    );

    const page = await context.newPage();
    await page.goto(`${server.baseUrl}/rtl`);

    const editorRoot = await openEditor(page, openPopup);
    const panel = editorRoot.locator('.stylebot.vdr');
    await expect(panel).toBeInViewport({ ratio: 1 });

    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const panelBox = (await panel.boundingBox())!;
    const bodyBox = (await page.locator('body').boundingBox())!;

    if (dockLocation === 'left') {
      expect(panelBox.x).toBeLessThan(viewportWidth / 2);
      expect(bodyBox.x).toBeGreaterThanOrEqual(panelBox.x + panelBox.width);
    } else {
      expect(panelBox.x + panelBox.width).toBeGreaterThan(viewportWidth / 2);
      expect(bodyBox.x + bodyBox.width).toBeLessThanOrEqual(panelBox.x);
    }
  });
}
