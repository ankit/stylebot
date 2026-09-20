import type { Page } from '@playwright/test';
import { test, expect, type Popup } from './fixtures';
import { startTestServer, waitForEditorListener } from './helpers';

// Long enough to pass hasReaderableContent; path has 2 segments so
// shouldRunOnUrl doesn't treat it as a section/category page.
const ARTICLE_HTML = `
  <!doctype html>
  <html>
    <head><title>Test Article</title></head>
    <body>
      <article>
        <h1>A Test Article</h1>
        <p>${'This is a long paragraph of article content used to satisfy the readability heuristic. '.repeat(
          10
        )}</p>
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

let server: Awaited<ReturnType<typeof startTestServer>>;
let articleUrl: string;
let secondArticleUrl: string;
let appUrl: string;

test.beforeAll(async () => {
  server = await startTestServer({
    '/articles/a-test-article': ARTICLE_HTML,
    '/articles/a-test-article-2': ARTICLE_HTML,
    '/app/dashboard': APP_HTML,
  });
  articleUrl = `${server.baseUrl}/articles/a-test-article`;
  secondArticleUrl = `${server.baseUrl}/articles/a-test-article-2`;
  appUrl = `${server.baseUrl}/app/dashboard`;
});

test.afterAll(() => server.close());

const readabilityToggle = (popup: Popup) =>
  popup.locator('label.switch', { hasText: 'Readability' });

// Flips the popup's Readability switch on for the popup's current tab.
const enableReadability = async (
  openPopup: () => Promise<Popup>
): Promise<void> => {
  const popup = await openPopup();
  // ToggleReadabilityForTab is handled by the editor script, not inject-css.
  await waitForEditorListener(popup);

  const checkbox = readabilityToggle(popup).locator('input[type="checkbox"]');
  await expect.poll(() => checkbox.isEnabled()).toBe(true);
  expect(await checkbox.isChecked()).toBe(false);

  await readabilityToggle(popup).locator('.track').click();
  await expect.poll(() => checkbox.isChecked()).toBe(true);
  await popup.close();
};

const reader = (page: Page) => page.locator('body > #stylebot-reader');

test('toggling readability on in the popup activates the reader', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(articleUrl);
  await page.bringToFront();

  await enableReadability(openPopup);

  await expect(reader(page)).toHaveCount(1);
});

// Regression test: chrome.tabs.query({ active: true }) had no window scope,
// so with multiple windows open the toggle could message the wrong tab.
test("toggling readability with a second window open targets the popup's own tab", async ({
  context,
  openPopup,
  extension,
}) => {
  const pageA = await context.newPage();
  await pageA.goto(articleUrl);
  await pageA.bringToFront();

  // The new window surfaces as about:blank first, so wait on the URL rather
  // than filtering the page event.
  const pageBPromise = context.waitForEvent('page');
  await extension.evaluate(
    url => chrome.windows.create({ url }),
    secondArticleUrl
  );
  const pageB = await pageBPromise;
  await pageB.waitForURL(secondArticleUrl);
  await pageB.bringToFront();

  // The popup opens in whichever window is frontmost — window B here —
  // mirroring a real toolbar click in that window.
  await enableReadability(openPopup);

  await expect(reader(pageB)).toHaveCount(1);
  await expect(reader(pageA)).toHaveCount(0);
});

// Regression test for #911: the reader's loading overlay used to flash on
// every reload of a page it could never turn into an article.
test('does not show the loading overlay when reloading a page already proven not to be an article', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  await page.goto(articleUrl);
  await page.bringToFront();

  await enableReadability(openPopup);

  // Wait for the mount, not just the popup's checkbox, so the domain-wide
  // flag is guaranteed to have reached storage before navigating away.
  await expect(reader(page)).toHaveCount(1);

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
            return (
              store.urls?.[new URL(url).origin + new URL(url).pathname] ===
              false
            );
          } catch {
            return false;
          }
        }, appUrl),
      { timeout: 10_000 }
    )
    .toBe(true);

  await page.reload();

  // Past the full retry window, so a wrongly-repeated attempt would have shown by now.
  await page.waitForTimeout(2500);

  await expect(page.locator('#stylebot-reader-loading-art')).toHaveCount(0);
  await expect(page.locator('#stylebot-reader')).toHaveCount(0);
  await expect(page.locator('#dashboard')).toBeVisible();
});
