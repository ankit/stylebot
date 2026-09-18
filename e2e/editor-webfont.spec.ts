import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect, closeServer } from './fixtures';
import { openEditor } from './helpers';

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

const FONT_CSS = `
  @font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/montserrat/test.woff2) format('woff2');
  }
`;

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      /**
       * The kind of policy that makes a font lookup from the content script
       * silently fail on Firefox (see #754).
       */
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'",
    });
    res.end(PAGE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/`;
});

test.afterAll(() => closeServer(server));

test('selecting a font looks it up from the background and inlines its @font-face', async ({
  context,
  extensionId: _extensionId,
  openPopup,
}) => {
  const fontRequests: Array<{ url: string; fromServiceWorker: boolean }> = [];

  await context.route('https://fonts.googleapis.com/**', route => {
    const request = route.request();

    if (request.url().includes('family=Montserrat')) {
      fontRequests.push({
        url: request.url(),
        fromServiceWorker: !!request.serviceWorker(),
      });
    }

    return route.fulfill({ contentType: 'text/css', body: FONT_CSS });
  });

  const page = await context.newPage();
  await page.goto(baseUrl);

  const editorRoot = await openEditor(page, openPopup);

  await expect(editorRoot.locator('.stylebot-inspector')).toHaveClass(/active/);
  await page.locator('h1').click({ force: true });
  await expect(editorRoot.locator('.css-selector-input')).toHaveValue(/h1$/);

  await editorRoot.getByRole('button', { name: 'Text', exact: true }).click();

  const dropdown = editorRoot.locator('.font-family-dropdown');
  await dropdown.locator('.dropdown-toggle').click();
  /**
   * A real click never reaches bootstrap-vue's handler inside the editor's
   * shadow root; dispatching does.
   */
  await dropdown
    .locator('a.dropdown-item', { hasText: 'Montserrat' })
    .dispatchEvent('click');

  await expect(page.locator('h1')).toHaveCSS('font-family', 'Montserrat');

  const stylesheet = page.locator('style[id^="stylebot-css-"]').first();
  await expect.poll(() => stylesheet.textContent()).toContain('@font-face');
  await expect.poll(() => stylesheet.textContent()).toContain('Montserrat');

  // Every lookup of the family comes from the background page.
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every(request => request.fromServiceWorker)).toBe(true);
});
