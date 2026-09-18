import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { BrowserContext } from '@playwright/test';
import { test, expect, closeServer, type Page } from './fixtures';
import { seedStyles } from './helpers';

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

let server: http.Server;
let articleUrl: string;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(ARTICLE_HTML);
  });

  await new Promise<void>(resolve => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  articleUrl = `http://localhost:${port}/articles/a-test-article`;
});

test.afterAll(() => closeServer(server));

// seedStyles reaches for the extension's service worker, which can still be
// evaluating right after the browser launches — poll until chrome is on it.
const waitForExtensionWorker = async (context: BrowserContext) => {
  await expect(async () => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));

    expect(await worker.evaluate(() => typeof chrome?.storage)).toBe('object');
  }).toPass();
};

const openStylesTab = async (page: Page, extensionId: string) => {
  await page.goto(`chrome-extension://${extensionId}/options/index.html`);
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
};

const readStoredStyles = async (page: Page) =>
  page.evaluate(
    () =>
      new Promise<Record<string, { css: string; readability: boolean }>>(
        resolve => {
          chrome.storage.local.get('styles', items =>
            resolve(items['styles'] ?? {})
          );
        }
      )
  );

test('the styles tab shows, filters and clears per-site readability', async ({
  context,
  extensionId,
}) => {
  await waitForExtensionWorker(context);

  await seedStyles(context, {
    'reader-only.test': { css: '', enabled: true, readability: true },
    'styled-reader.test': {
      css: 'h1 { color: red; }',
      enabled: true,
      readability: true,
    },
    'styled-only.test': { css: 'h1 { color: blue; }', enabled: true },
  });

  const page = await context.newPage();
  await openStylesTab(page, extensionId);

  const rows = page.locator('.row');
  await expect(rows).toHaveCount(3);

  // The badge is what explains why a css-less, readability-only site is listed.
  await expect(page.locator('.readability-badge')).toHaveCount(2);

  const filter = page.locator('.filter-chip');
  await expect(filter).toHaveText('Readability (2)');

  await filter.click();
  await expect(rows).toHaveCount(2);
  await expect(page.getByText('styled-only.test')).toHaveCount(0);

  // A readability-only entry has nothing left to represent once it's off.
  await rows
    .filter({ hasText: 'reader-only.test' })
    .getByTitle('More actions')
    .click();
  await page.getByText('Turn off readability for reader-only.test').click();

  await expect(rows).toHaveCount(1);
  await expect(async () => {
    expect(await readStoredStyles(page)).not.toHaveProperty('reader-only.test');
  }).toPass();

  // A styled entry keeps its css and just loses the flag.
  await rows
    .filter({ hasText: 'styled-reader.test' })
    .getByTitle('More actions')
    .click();
  await page.getByText('Turn off readability for styled-reader.test').click();

  await expect(filter).toHaveCount(0);
  await expect(async () => {
    const styles = await readStoredStyles(page);
    expect(styles['styled-reader.test']).toMatchObject({
      css: 'h1 { color: red; }',
      readability: false,
    });
  }).toPass();

  await expect(page.locator('.readability-badge')).toHaveCount(0);
});

test('turning readability off in the options page tears down an open reader', async ({
  context,
  extensionId,
}) => {
  await waitForExtensionWorker(context);

  await seedStyles(context, {
    localhost: { css: '', enabled: true, readability: true },
  });

  const articleTab = await context.newPage();
  await articleTab.goto(articleUrl);

  // Generous: under parallel CPU load the reader's extraction can lag.
  await expect(articleTab.locator('div#stylebot-reader')).toBeAttached({
    timeout: 15000,
  });

  const optionsTab = await context.newPage();
  await openStylesTab(optionsTab, extensionId);

  await optionsTab
    .locator('.row')
    .filter({ hasText: 'localhost' })
    .getByTitle('More actions')
    .click();
  await optionsTab.getByText('Turn off readability for localhost').click();

  // No reload: propagation is a chrome.tabs.sendMessage fan-out with no
  // completion signal, so this has to poll.
  await expect(articleTab.locator('div#stylebot-reader')).not.toBeAttached();
});
