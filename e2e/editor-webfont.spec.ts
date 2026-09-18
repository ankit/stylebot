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
  await expect(
    editorRoot.locator('.autocomplete-chips .chip').first()
  ).toHaveText(/h1$/);

  // A freshly picked element with no existing declarations auto-expands the
  // Text panel, which hosts the font-family select (see TheTextProperties.vue).
  // page-scoped, not editorRoot-scoped: see e2e/color-picker.spec.ts.
  const textCard = page.locator('.property-card').filter({
    has: page.locator('.property-card-label', { hasText: /^Text$/ }),
  });
  await textCard.locator('.select-trigger').first().click();
  await page.getByRole('menuitem', { name: 'Montserrat', exact: true }).click();

  await expect(page.locator('h1')).toHaveCSS('font-family', 'Montserrat');

  const stylesheet = page.locator('style[id^="stylebot-css-"]').first();
  await expect.poll(() => stylesheet.textContent()).toContain('@font-face');
  await expect.poll(() => stylesheet.textContent()).toContain('Montserrat');

  // Every lookup of the family comes from the background page.
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every(request => request.fromServiceWorker)).toBe(true);
});
