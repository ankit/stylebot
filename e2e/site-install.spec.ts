import type { BrowserContext, Page } from '@playwright/test';

import { test, expect } from './fixtures';
import { PAGE_URL, seedStyles, servePage } from './helpers';

const SITE_URL = 'https://stylebot.dev/';
const OTHER_SITE_URL = 'https://example.com/';
const PURPLE = 'rgb(128, 0, 128)';
const PINK = 'rgb(255, 0, 128)';

const serveSites = (context: BrowserContext) =>
  Promise.all(
    [SITE_URL, OTHER_SITE_URL].map(url =>
      context.route(`${url}**`, route =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><body>Gallery</body></html>',
        })
      )
    )
  );

/**
 * Posts a message the way the stylebot.dev gallery does and resolves with the
 * bridge's answer of the given type, or null when none comes.
 */
const postToBridge = (
  page: Page,
  message: Record<string, unknown>,
  answerType: string
) =>
  page.evaluate(
    ([message, answerType]) =>
      new Promise<Record<string, unknown> | null>(resolve => {
        const timer = setTimeout(() => resolve(null), 2000);

        window.addEventListener('message', e => {
          if (e.source === window && e.data?.type === answerType) {
            clearTimeout(timer);
            resolve(e.data);
          }
        });
        window.postMessage(message, location.origin);
      }),
    [message, answerType] as const
  );

const install = (page: Page, name: string) =>
  postToBridge(
    page,
    {
      type: 'stylebot:install',
      id: name,
      url: 'localhost',
      name,
      css: `h1 { color: ${PURPLE}; }`,
    },
    'stylebot:installed'
  );

test('stylebot.dev installs a gallery style as a new, active profile', async ({
  context,
  extension,
}) => {
  await serveSites(context);
  await servePage(context, '<!doctype html><h1>Test page</h1>');
  await seedStyles(extension, {
    localhost: { css: `h1 { color: ${PINK}; }`, enabled: true },
  });

  const site = await context.newPage();
  await site.goto(SITE_URL);

  expect(
    await postToBridge(site, { type: 'stylebot:ping' }, 'stylebot:pong')
  ).not.toBeNull();
  expect(await install(site, 'Dracula')).toMatchObject({
    profileName: 'Dracula',
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await expect(page.locator('h1')).toHaveCSS('color', PURPLE);

  const stored = await extension.evaluate(async () => {
    const { styles } = await chrome.storage.local.get('styles');
    return styles.localhost;
  });
  expect(stored.profiles.default).toEqual({
    name: '',
    css: `h1 { color: ${PINK}; }`,
  });
});

test('other sites get no bridge to install through', async ({ context }) => {
  await serveSites(context);

  const other = await context.newPage();
  await other.goto(OTHER_SITE_URL);

  expect(
    await postToBridge(other, { type: 'stylebot:ping' }, 'stylebot:pong')
  ).toBeNull();
});
