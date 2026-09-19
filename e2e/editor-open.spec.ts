import { test, expect } from './fixtures';
import { startTestServer } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    '/': PAGE_HTML,
  }));
});

test.afterAll(() => closePageServer());

test('opening Stylebot from the popup opens the editor in the current tab', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(baseUrl);

  // init-editor.ts mounts the editor under this host once ToggleStylebot reaches it.
  await expect(page.locator('#stylebot')).toHaveCount(0);

  // Pins this as the "active" tab, in case the onInstalled help tab grabbed focus.
  await page.bringToFront();

  // The popup calls window.close() right after sending the toggle message, which
  // races a plain .click()'s post-click stability wait — dispatch instead.
  const popup = await openPopup();
  await popup
    .getByRole('button', { name: /^Style this page/ })
    .dispatchEvent('click');

  // The host is deliberately 0x0 (see init-editor.ts) — assert presence, not visibility.
  await expect(page.locator('#stylebot')).toBeAttached();
});
