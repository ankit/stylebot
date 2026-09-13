import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Worker } from '@playwright/test';
import { test, expect } from './fixtures';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <head><title>Plain test page</title></head>
    <body><h1>Plain test page</h1></body>
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

const setStyle = (worker: Worker, host: string, readability: boolean) =>
  worker.evaluate(
    ([h, r]: [string, boolean]) =>
      chrome.storage.local.set({
        styles: {
          [h]: {
            css: '',
            enabled: true,
            readability: r,
            modifiedTime: new Date().toISOString(),
          },
        },
      }),
    [host, readability]
  );

test('the readability chunk is never fetched when readability is off', async ({
  context,
  extensionId: _extensionId,
}) => {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  await setStyle(worker, new URL(baseUrl).host, false);

  const requests: string[] = [];
  const page = await context.newPage();
  page.on('request', req => requests.push(req.url()));

  await page.goto(baseUrl);
  await page.waitForTimeout(500);

  expect(requests.some(u => u.includes('readability-lazy'))).toBe(false);
});

test('the readability chunk loads successfully when readability is on', async ({
  context,
  extensionId: _extensionId,
}) => {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  await setStyle(worker, new URL(baseUrl).host, true);

  const chunkResponses: number[] = [];
  const page = await context.newPage();
  page.on('response', res => {
    if (res.url().includes('readability-lazy') || res.url().includes('vendors~readability-lazy')) {
      chunkResponses.push(res.status());
    }
  });

  await page.goto(baseUrl);

  // Proves the dynamic import(), the __webpack_public_path__ override (so
  // it resolves against the extension, not this page's own origin), and
  // the web_accessible_resources wildcard all actually work together in a
  // real browser — as opposed to the module just failing to load silently.
  await expect.poll(() => chunkResponses.length).toBeGreaterThan(0);
  expect(chunkResponses.every(status => status === 200)).toBe(true);
});
