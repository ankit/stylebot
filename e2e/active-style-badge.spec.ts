import { test, expect, type Extension } from './fixtures';
import {
  PAGE_URL,
  seedStyles,
  servePage,
  startTestServer,
  waitForEditorListener,
} from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

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

const APP_HTML = `
  <!doctype html>
  <html>
    <head><title>Test App</title></head>
    <body>
      <div id="dashboard">Dashboard</div>
    </body>
  </html>
`;

const STYLE = { css: 'h1 { color: rgb(255, 0, 128); }', enabled: true };

const getBadge = (extension: Extension, url: string) =>
  extension.evaluate(async pageUrl => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find(({ url: tabUrl }) => tabUrl === pageUrl);

    return chrome.action.getBadgeText({ tabId: tab?.id });
  }, url);

const setBadgeOption = (extension: Extension, value: boolean) =>
  extension.evaluate(async activeStyleBadge => {
    const { options } = await chrome.storage.local.get('options');

    await chrome.storage.local.set({
      options: { ...options, activeStyleBadge },
    });
  }, value);

test('the toolbar icon counts the styles on a page while the option is on', async ({
  context,
  extension,
}) => {
  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: STYLE });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('');

  await setBadgeOption(extension, true);
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('1');

  await page.reload();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 128)');
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('1');

  await seedStyles(extension, { localhost: { ...STYLE, enabled: false } });
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('');

  await seedStyles(extension, { localhost: STYLE });
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('1');

  await setBadgeOption(extension, false);
  await expect.poll(() => getBadge(extension, PAGE_URL)).toBe('');
});

test('the toolbar icon counts the reader only where it opened', async ({
  context,
  extension,
}) => {
  const server = await startTestServer({
    '/articles/a-test-article': ARTICLE_HTML,
    '/app/dashboard': APP_HTML,
  });
  const articleUrl = `${server.baseUrl}/articles/a-test-article`;
  const appUrl = `${server.baseUrl}/app/dashboard`;

  await setBadgeOption(extension, true);
  await seedStyles(extension, {
    localhost: { ...STYLE, readability: true },
  });

  const app = await context.newPage();
  await app.goto(appUrl);
  await expect.poll(() => getBadge(extension, appUrl)).toBe('1');

  const article = await context.newPage();
  await article.goto(articleUrl);
  await expect(article.locator('div#stylebot-reader')).toBeAttached();
  await expect.poll(() => getBadge(extension, articleUrl)).toBe('2');

  // What the background relays when the reader's own dock turns it off. The
  // editor's listener only answers once its async init finishes, so this retries.
  await expect(async () => {
    await extension.evaluate(async pageUrl => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(({ url }) => url === pageUrl);

      await chrome.tabs.sendMessage(tab?.id as number, {
        name: 'ReadabilityStateChanged',
        value: false,
      });
    }, articleUrl);
    await expect(article.locator('div#stylebot-reader')).not.toBeAttached({
      timeout: 1000,
    });
  }).toPass();
  await expect.poll(() => getBadge(extension, articleUrl)).toBe('1');

  await server.close();
});

test.describe('turning the reader on from the popup', () => {
  for (const [name, styles, count] of [
    ['with no style', {}, '1'],
    ['with a style', { localhost: STYLE }, '2'],
  ] as const) {
    test(`counts it on a page ${name}`, async ({
      context,
      extension,
      openPopup,
    }) => {
      const server = await startTestServer({
        '/articles/a-test-article': ARTICLE_HTML,
      });
      const articleUrl = `${server.baseUrl}/articles/a-test-article`;

      await setBadgeOption(extension, true);
      await seedStyles(extension, styles);

      const page = await context.newPage();
      await page.goto(articleUrl);
      await page.bringToFront();

      const popup = await openPopup();
      await waitForEditorListener(popup);

      const toggle = popup.locator('label.switch', { hasText: 'Readability' });
      const checkbox = toggle.locator('input[type="checkbox"]');

      await expect.poll(() => checkbox.isEnabled()).toBe(true);
      await toggle.locator('.track').click();
      await expect.poll(() => checkbox.isChecked()).toBe(true);
      await popup.close();

      await expect(page.locator('div#stylebot-reader')).toBeAttached();
      await expect.poll(() => getBadge(extension, articleUrl)).toBe(count);

      await page.reload();
      await expect(page.locator('div#stylebot-reader')).toBeAttached();
      await expect.poll(() => getBadge(extension, articleUrl)).toBe(count);

      await server.close();
    });
  }
});
