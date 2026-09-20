import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head>
      <style>
        h1 { color: rgb(255, 0, 0) !important; font-style: normal !important; }
        h1 + p { color: rgb(255, 0, 0) !important; }
      </style>
    </head>
    <body>
      <h1>Test page</h1>
      <p>Paragraph</p>
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
  extension,
}) => {
  await seedStyles(extension, {
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

test('injects native CSS nesting intact, with !important reaching nested rules and nested @media (#782)', async ({
  context,
  extension,
}) => {
  await seedStyles(extension, {
    localhost: {
      css: `h1 {
  color: rgb(0, 0, 255);
  & + p {
    color: rgb(0, 128, 0);
  }
  @media (min-width: 1px) {
    font-style: italic;
  }
}`,
      enabled: true,
    },
  });

  const page = await context.newPage();
  await page.goto(server.baseUrl);
  await page.reload();

  // The page's own rules are all !important, so each of these only holds
  // if injection kept the nesting and marked the nested declarations too.
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(page.locator('h1')).toHaveCSS('font-style', 'italic');
  await expect(page.locator('p')).toHaveCSS('color', 'rgb(0, 128, 0)');
});
