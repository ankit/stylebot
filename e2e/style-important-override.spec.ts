import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>h1 { color: rgb(255, 0, 0) !important; }</style>
    </head>
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

test('overrides a page rule that also uses !important (regression: #894)', async ({
  context,
  runInExtension,
}) => {
  await seedStyles(runInExtension, {
    localhost: {
      css: 'h1 { color: rgb(0, 0, 255) !important; }',
      enabled: true,
    },
  });

  const page = await context.newPage();

  // Only a repeat visit hits the localStorage-cached, fully synchronous
  // injection path where the race in #894 actually occurs.
  await page.goto(server.baseUrl);
  await page.reload();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});
