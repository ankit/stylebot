import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

// Every page rule is !important, so the style only wins where the compiled
// copy marked its declarations !important too.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>
        h1 { color: rgb(255, 0, 0) !important; margin: 0 !important; }
        p { font-style: normal !important; }
      </style>
    </head>
    <body>
      <h1>Test page</h1>
      <p>Paragraph</p>
      <div class="imported">Imported</div>
    </body>
  </html>
`;

const IMPORTED_CSS = '.imported { color: rgb(0, 128, 0); }';

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({
    '/': PAGE_HTML,
    '/imported.css': {
      body: IMPORTED_CSS,
      headers: {
        'Content-Type': 'text/css',
        'Access-Control-Allow-Origin': '*',
      },
    },
  });
});

test.afterAll(() => server.close());

const styleCss = () => `@import url("${server.baseUrl}/imported.css");
:root { --brand: rgb(0, 0, 255); --gap: 7px; }
h1 { color: var(--brand); margin: var(--gap); }
@media (min-width: 1px) { p { font-style: italic; } }
@keyframes fade { from { opacity: 0.5; } to { opacity: 1; } }`;

test('applies a compiled style with @import, @media, @keyframes and var() shorthands on first and repeat visits', async ({
  context,
  extension,
}) => {
  await seedStyles(extension, {
    localhost: { css: styleCss(), enabled: true },
  });

  const page = await context.newPage();

  // The first visit has no page cache and no stored compiled copy, so it
  // asks the background; the reload applies the page cache at first paint.
  for (const visit of [() => page.goto(server.baseUrl), () => page.reload()]) {
    await visit();

    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
    await expect(page.locator('h1')).toHaveCSS('margin-top', '7px');
    await expect(page.locator('p')).toHaveCSS('font-style', 'italic');
    await expect(page.locator('.imported')).toHaveCSS(
      'color',
      'rgb(0, 128, 0)'
    );
  }

  // !important inside @keyframes is invalid and would void the keyframe.
  const injected = await page
    .locator('[id="stylebot-css-localhost"]')
    .textContent();
  expect(injected).toMatch(/@keyframes fade \{\s*from \{ opacity: 0\.5; \}/);
});

test('uses the compiled copy the background stored, on a new tab', async ({
  context,
  extension,
}) => {
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(0, 0, 255); }', enabled: true },
  });

  // The first page's fallback leaves the rebuilt copy in storage.
  const first = await context.newPage();
  await first.goto(server.baseUrl);
  await expect(first.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');

  await expect
    .poll(() =>
      extension.evaluate(async () =>
        Boolean(
          (
            await chrome.storage.local.get('styles-compiled')
          )['styles-compiled']
        )
      )
    )
    .toBe(true);

  const second = await context.newPage();
  await second.goto(server.baseUrl);
  await expect(second.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});
