import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect, closeServer, type Page } from './fixtures';

// Content script / background worker readiness can lag under heavy parallel CPU
// load (multiple worker-owned browsers competing for CPU), delaying this check.
test.describe.configure({ retries: 2 });

// Long enough to pass hasReaderableContent; path has 2 segments so
// shouldRunOnUrl doesn't treat it as a section/category page.
const ARTICLE_HTML = `
  <!doctype html>
  <html>
    <head><title>Test Article</title></head>
    <body>
      <article>
        <h1>A Test Article</h1>
        <p>${'This is a long paragraph of article content used to satisfy the readability heuristic. '.repeat(10)}</p>
      </article>
    </body>
  </html>
`;

// SPA-style: 2 path segments avoid shouldRunOnUrl's section filter, but no
// <p>/<article> content means hasReaderableContent fails and always will.
const APP_HTML = `
  <!doctype html>
  <html>
    <head><title>Test App</title></head>
    <body>
      <div id="dashboard">Dashboard</div>
    </body>
  </html>
`;

let server: http.Server;
let baseUrl: string;
let appUrl: string;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(req.url?.startsWith('/app/') ? APP_HTML : ARTICLE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://localhost:${port}/articles/a-test-article`;
  appUrl = `http://localhost:${port}/app/dashboard`;
});

test.afterAll(() => closeServer(server));

const readabilityToggle = (popup: Page) =>
  popup.locator('text=Readability').locator('..');

test('toggling readability on in the popup activates the reader', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.bringToFront();

  const popup = await openPopup();
  const toggle = readabilityToggle(popup).locator('input[type="checkbox"]');

  // toBeEnabled with a generous timeout: under heavy parallel CPU load the
  // content script's GetIsPageReaderable can lag behind the popup opening.
  await expect(toggle).toBeEnabled({ timeout: 15000 });
  await expect(toggle).not.toBeChecked();

  await readabilityToggle(popup).locator('.track').click();
  await expect(toggle).toBeChecked();
  await popup.close();

  await expect(page.locator('body > #stylebot-reader')).toHaveCount(1, {
    timeout: 10000,
  });
});

// Regression test: chrome.tabs.query({ active: true }) had no window scope,
// so with multiple windows open the toggle could message the wrong tab.
test('toggling readability with a second window open targets the popup\'s own tab', async ({
  context,
  openPopup,
}) => {
  // Two tabs cold-starting their editor init chains contend for the same
  // background worker, which can delay listener readiness — wider budget.
  test.setTimeout(45000);

  const pageA = await context.newPage();
  await pageA.goto(baseUrl);
  await pageA.bringToFront();

  const cdp = await context.browser()!.newBrowserCDPSession();
  await cdp.send('Target.createTarget', {
    url: `${baseUrl}-2`,
    newWindow: true,
  });
  const pageB = await context.waitForEvent('page', p =>
    p.url().endsWith('-2')
  );
  await pageB.bringToFront();

  // The popup opens in whichever window is frontmost — window B here —
  // mirroring a real toolbar click in that window.
  const popup = await openPopup();
  const toggle = readabilityToggle(popup).locator('input[type="checkbox"]');

  await expect(toggle).toBeVisible({ timeout: 5000 });
  await expect(toggle).toBeEnabled();
  await readabilityToggle(popup).locator('.track').click();
  await expect(toggle).toBeChecked();
  await popup.close();

  const reader = pageB.locator('body > #stylebot-reader');
  try {
    await expect(reader).toHaveCount(1, { timeout: 6000 });
  } catch {
    // No delivery guarantee — an unready listener drops the message rather
    // than delaying it, so resend now that init has surely finished.
    const retry = await openPopup();
    await readabilityToggle(retry).locator('.track').click();
    await retry.close();
    await expect(reader).toHaveCount(1, { timeout: 8000 });
  }

  await expect(pageA.locator('body > #stylebot-reader')).toHaveCount(0);

  await cdp.detach();
});

// Regression test for #911: the reader's loading overlay used to flash on
// every reload of a page it could never turn into an article.
test('does not show the loading overlay when reloading a page already proven not to be an article', async ({
  context,
  openPopup,
}) => {
  test.setTimeout(30000);

  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.bringToFront();

  const popup = await openPopup();
  const toggle = readabilityToggle(popup).locator('input[type="checkbox"]');
  await expect(toggle).toBeEnabled({ timeout: 15000 });
  await readabilityToggle(popup).locator('.track').click();
  await expect(toggle).toBeChecked();
  await popup.close();

  // Wait for the mount, not just the popup's checkbox, so the domain-wide
  // flag is guaranteed to have reached storage before navigating away.
  await expect(page.locator('body > #stylebot-reader')).toHaveCount(1, {
    timeout: 10000,
  });

  // Its shape doesn't match the article pattern just learned, so the loader
  // should be skipped even on this first visit — the attempt still runs silently.
  await page.goto(appUrl);

  await expect(page.locator('#stylebot-reader-loading-art')).toHaveCount(0);
  await expect(page.locator('#dashboard')).toBeVisible();

  // It can't find an article either, so it should eventually give up and
  // record that this exact url is ineligible.
  await expect
    .poll(
      () =>
        page.evaluate(url => {
          try {
            const store = JSON.parse(
              localStorage.getItem('stylebot-reader-eligibility') || '{}'
            );
            return store.urls?.[new URL(url).origin + new URL(url).pathname] === false;
          } catch {
            return false;
          }
        }, appUrl),
      { timeout: 10000 }
    )
    .toBe(true);

  await page.reload();

  // Past the full retry window, so a wrongly-repeated attempt would have shown by now.
  await page.waitForTimeout(2500);

  await expect(page.locator('#stylebot-reader-loading-art')).toHaveCount(0);
  await expect(page.locator('#stylebot-reader')).toHaveCount(0);
  await expect(page.locator('#dashboard')).toBeVisible();
});
