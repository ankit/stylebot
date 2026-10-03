import { test, expect } from './fixtures';
import { startTestServer, seedStyles } from './helpers';

// From #743: a page that fills script-written iframes with no src of their own.
const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>On page</h1>
      <iframe name="static" src="/child"></iframe>
      <iframe name="written"></iframe>
      <script>
        const write = (win, text) => {
          win.document.open();
          win.document.write('<h1>' + text + '</h1>');
          win.document.close();
        };
        write(window.written, 'In written');

        const created = document.createElement('iframe');
        created.name = 'created';
        document.body.appendChild(created);
        write(created.contentWindow, 'In created');

        const appended = document.createElement('iframe');
        appended.name = 'appended';
        document.body.appendChild(appended);
        appended.contentDocument.body.innerHTML = '<h1>In appended</h1>';
      </script>
    </body>
  </html>
`;

let server: Awaited<ReturnType<typeof startTestServer>>;

test.beforeAll(async () => {
  server = await startTestServer({
    '/': PAGE_HTML,
    '/child': '<!doctype html><h1>In static</h1>',
  });
});

test.afterAll(() => server.close());

test('applies the page style inside iframes with no src of their own (#743)', async ({
  context,
  extension,
}) => {
  await seedStyles(extension, {
    localhost: { css: 'h1 { color: rgb(0, 0, 255); }', enabled: true },
  });

  const page = await context.newPage();
  await page.goto(server.baseUrl);

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');

  for (const name of ['static', 'written', 'created', 'appended']) {
    await expect(
      page.frameLocator(`iframe[name="${name}"]`).locator('h1'),
      name
    ).toHaveCSS('color', 'rgb(0, 0, 255)');
  }
});
