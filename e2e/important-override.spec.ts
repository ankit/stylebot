import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect, closeServer } from './fixtures';

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

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(PAGE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/`;
});

test.afterAll(() => closeServer(server));

test('overrides a page rule that also uses !important (regression: #894)', async ({
  context,
  extensionId: _extensionId,
}) => {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

  await worker.evaluate(() =>
    chrome.storage.local.set({
      styles: {
        localhost: {
          css: 'h1 { color: rgb(0, 0, 255) !important; }',
          enabled: true,
          readability: false,
          modifiedTime: new Date().toISOString(),
        },
      },
    })
  );

  const page = await context.newPage();

  // Only a repeat visit hits the localStorage-cached, fully synchronous
  // injection path where the race in #894 actually occurs.
  await page.goto(baseUrl);
  await page.reload();

  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 255)');
});
