import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect } from './fixtures';

const PARAGRAPH =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod ' +
  'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim ' +
  'veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea ' +
  'commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head><title>A readerable test article</title></head>
    <body>
      <article>
        <h1>A readerable test article</h1>
        <p>${PARAGRAPH}</p>
        <p>${PARAGRAPH}</p>
        <p>${PARAGRAPH}</p>
      </article>
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

test.afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('readability is derived and applied on page load without injecting the editor', async ({
  context,
  extensionId: _extensionId,
}) => {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

  await worker.evaluate(url =>
    chrome.storage.local.set({
      styles: {
        [new URL(url).host]: {
          css: '',
          enabled: true,
          readability: true,
          modifiedTime: new Date().toISOString(),
        },
      },
    }),
    baseUrl
  );

  const page = await context.newPage();
  await page.goto(baseUrl);

  // src/inject-css/index.ts's run() derives and caches this itself, in the
  // same document_start pass that applies CSS — proves it doesn't wait on
  // or depend on editor/index.js (on-demand injected under this change) at
  // all. The full Reader Mode DOM mount additionally depends on Defuddle's
  // own content-extraction succeeding, which is unrelated to this change
  // and already covered by src/inject-css/__tests__/apply-state.test.ts.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('stylebot-cache')))
    .toContain('"readability":true');

  await expect(page.locator('#stylebot')).toHaveCount(0);
});
