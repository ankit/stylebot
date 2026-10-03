import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const FONT_URL = 'https://fonts.gstatic.com/s/lobster/test.woff2';

const FONT_CSS = `
  @font-face {
    font-family: 'Lobster';
    font-style: normal;
    font-weight: 400;
    src: url(${FONT_URL}) format('woff2');
  }
`;

const FONT_FILE = readFileSync(
  path.join(__dirname, '../src/assets/fonts/geist-latin.woff2')
);

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({
    '/': {
      body: PAGE_HTML,
      headers: {
        // Hacker News's policy: no font-src, so fonts fall back to 'self'.
        // Only Firefox applies it to fonts in extension-injected CSS.
        'Content-Security-Policy':
          "default-src 'self'; style-src 'self' 'unsafe-inline'",
      },
    },
  });
});

test.afterAll(() => server.close());

test('loads a Google Font the page CSP blocks', async ({
  context,
  engine,
  extension,
}) => {
  // Elsewhere the background's requests go to the real Google Fonts.
  if (engine.routesExtensionRequests) {
    await context.route('https://fonts.googleapis.com/**', route =>
      route.fulfill({ contentType: 'text/css', body: FONT_CSS })
    );
    await context.route(FONT_URL, route =>
      route.fulfill({ contentType: 'font/woff2', body: FONT_FILE })
    );
  }

  await seedStyles(extension, {
    localhost: {
      css: `@import url(https://fonts.googleapis.com/css2?family=Lobster&display=swap);
h1 { font-family: Lobster; }`,
      enabled: true,
    },
  });

  const page = await context.newPage();
  await page.goto(server.baseUrl);

  await expect(page.locator('h1')).toHaveCSS('font-family', 'Lobster');
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          face =>
            face.family.replace(/["']/g, '') === 'Lobster' &&
            face.status === 'loaded'
        )
      )
    )
    .toBe(true);
});
