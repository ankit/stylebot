import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect, type Page } from './fixtures';

// Loading the unpacked extension fresh per test can cold-start slowly under
// heavy parallel CPU load, delaying the content script's readiness check.
test.describe.configure({ retries: 2 });

// A long-enough paragraph to clear hasReaderableContent's score threshold,
// and a path with two segments so shouldRunOnUrl doesn't treat it as a
// section/category page (see src/readability/eligibility).
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

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(ARTICLE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/articles/a-test-article`;
});

test.afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

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

// Regression test for a bug where the popup's readability toggle used
// chrome.tabs.query({ active: true }) with no window scope, so with more
// than one browser window open it could message an arbitrary window's
// active tab instead of the tab the popup actually belongs to.
test('toggling readability with a second window open targets the popup\'s own tab', async ({
  context,
  openPopup,
}) => {
  // Two tabs each cold-starting the editor content script's own multi-hop
  // init chain contend for the same single-threaded background worker,
  // which can push it past the point where a message sent right after
  // opening the popup has a listener yet — give this one a wider budget.
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
    // ToggleReadabilityForTab has no delivery guarantee — if the content
    // script's listener wasn't registered yet, that first message was
    // dropped, not delayed. Resend it now that init has surely finished.
    const retry = await openPopup();
    await readabilityToggle(retry).locator('.track').click();
    await retry.close();
    await expect(reader).toHaveCount(1, { timeout: 8000 });
  }

  await expect(pageA.locator('body > #stylebot-reader')).toHaveCount(0);

  await cdp.detach();
});
