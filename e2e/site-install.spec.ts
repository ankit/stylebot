import type { BrowserContext, Page } from '@playwright/test';

import { test, expect } from './fixtures';
import { PAGE_URL, seedStyles, servePage } from './helpers';

const SITE_URL = 'https://stylebot.dev/';
const GALLERY_URL = 'https://gallery.stylebot.dev/';
const OTHER_SITE_URL = 'https://example.com/';
const PURPLE = 'rgb(128, 0, 128)';
const PINK = 'rgb(255, 0, 128)';

const serveSites = (context: BrowserContext) =>
  Promise.all(
    [SITE_URL, GALLERY_URL, OTHER_SITE_URL].map(url =>
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

test('the gallery finds the bridge on <html> and installs through it', async ({
  context,
  extension,
}) => {
  await serveSites(context);

  const gallery = await context.newPage();
  await gallery.goto(GALLERY_URL);

  await expect(gallery.locator('html')).toHaveAttribute(
    'data-stylebot-bridge',
    '1'
  );
  expect(await install(gallery, 'Nord')).toMatchObject({
    profileName: 'Nord',
  });

  const stored = await extension.evaluate(async () => {
    const { styles } = await chrome.storage.local.get('styles');
    return styles.localhost;
  });
  expect(Object.values(stored.profiles)).toContainEqual(
    expect.objectContaining({ name: 'Nord' })
  );
});

test('other sites get no bridge to install through', async ({ context }) => {
  await serveSites(context);

  const other = await context.newPage();
  await other.goto(OTHER_SITE_URL);

  await expect(other.locator('html')).not.toHaveAttribute(
    'data-stylebot-bridge'
  );
  expect(
    await postToBridge(other, { type: 'stylebot:ping' }, 'stylebot:pong')
  ).toBeNull();
});

const GALLERY_API = 'https://api.stylebot.dev/v1';

const night = {
  id: 7,
  site: 'example.com',
  slug: 'night',
  name: 'Night',
  description: null,
  author: { id: 'author', name: null },
  version: 1,
  installs: 0,
  createdAt: 0,
  updatedAt: 0,
  screenshot: '/screenshots/7/1',
  css: `h1 { color: ${PURPLE}; }`,
};

/**
 * Asks the bridge which of the gallery styles are installed, the way the
 * gallery's browse grid does, and resolves with its answer.
 */
const installStatus = (page: Page, styleIds: Array<number>) =>
  page.evaluate(
    styleIds =>
      new Promise<Record<string, string> | null>(resolve => {
        const id = crypto.randomUUID();
        const timer = setTimeout(() => resolve(null), 2000);

        window.addEventListener('message', e => {
          if (
            e.source === window &&
            e.data?.type === 'stylebot:status:result' &&
            e.data.id === id
          ) {
            clearTimeout(timer);
            resolve(e.data.installed);
          }
        });
        window.postMessage(
          { type: 'stylebot:status', id, styleIds },
          location.origin
        );
      }),
    styleIds
  );

test.describe('install status', () => {
  test.skip(
    ({ engine }) =>
      !engine.opensExtensionPages || !engine.routesExtensionRequests,
    "Serves the Gallery's API to the background and installs from an extension page"
  );

  test('the gallery sees a style installed from its preview, until its profile is removed', async ({
    context,
    extension,
  }) => {
    await serveSites(context);
    await context.route(`${GALLERY_API}/**`, route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(night),
      })
    );

    const gallery = await context.newPage();
    await gallery.goto(GALLERY_URL);
    expect(await installStatus(gallery, [7, 8])).toEqual({});

    await test.step('preview it from the gallery and install it', async () => {
      await gallery.evaluate(() => {
        const button = document.createElement('button');

        button.textContent = 'Try on site';
        button.onclick = () =>
          window.postMessage(
            { type: 'stylebot:preview', id: 7 },
            location.origin
          );
        document.body.append(button);
      });

      const previewTab = context.waitForEvent('page');
      await gallery.click('text=Try on site');
      await (await previewTab).waitForURL(OTHER_SITE_URL);

      const extensionPage = await context.newPage();
      await extensionPage.goto(
        `chrome-extension://${extension.id}/options.html`
      );

      expect(
        await extensionPage.evaluate(async url => {
          const [tab] = await chrome.tabs.query({ url: `${url}*` });

          return chrome.runtime.sendMessage({
            name: 'InstallGalleryPreview',
            tabId: tab.id,
          });
        }, OTHER_SITE_URL)
      ).toEqual({ ok: true, profileName: 'Night' });
      await extensionPage.close();
    });

    expect(await installStatus(gallery, [7, 8])).toEqual({
      7: 'Night',
    });

    await extension.evaluate(async () => {
      const { styles } = await chrome.storage.local.get('styles');
      const style = styles['example.com'];
      const [id] = Object.entries(style.profiles).find(
        ([, profile]) => (profile as { name: string }).name === 'Night'
      ) as [string, unknown];

      delete style.profiles[id];
      await chrome.storage.local.set({ styles });
    });

    expect(await installStatus(gallery, [7, 8])).toEqual({});
  });

  test('other sites get no install status', async ({ context }) => {
    await serveSites(context);

    const other = await context.newPage();
    await other.goto(OTHER_SITE_URL);

    expect(await installStatus(other, [7])).toBeNull();
  });
});

test.describe('published styles', () => {
  const PUBLISHED_CSS = `h1 { color: ${PINK}; }`;

  test.beforeEach(async ({ context, extension }) => {
    await serveSites(context);
    await extension.evaluate(async css => {
      await chrome.storage.local.set({
        styles: {
          'example.com': {
            css: '',
            enabled: true,
            readability: false,
            modifiedTime: new Date().toISOString(),
            activeProfile: 'default',
            profiles: {
              default: { name: '' },
              mine: {
                name: 'Mine',
                css,
                galleryListing: {
                  styleId: 8,
                  slug: 'mine',
                  version: 2,
                  cssHash: 'stale',
                  published: true,
                },
              },
            },
          },
        },
      });
    }, PUBLISHED_CSS);
  });

  test('the gallery sees a style published from here with unpublished edits, and publishes them from its tab', async ({
    context,
  }) => {
    const gallery = await context.newPage();
    await gallery.goto(`${GALLERY_URL}mine`);

    expect(
      await postToBridge(
        gallery,
        { type: 'stylebot:status', id: 'status', styleIds: [8, 9] },
        'stylebot:status:result'
      )
    ).toEqual({
      type: 'stylebot:status:result',
      id: 'status',
      installed: { 8: 'Mine' },
      published: { 8: { version: 2, changed: true } },
    });

    await test.step('click Publish update', async () => {
      await gallery.evaluate(() => {
        const button = document.createElement('button');

        button.textContent = 'Publish update';
        button.onclick = () =>
          window.postMessage(
            { type: 'stylebot:publish', id: 8 },
            location.origin
          );
        document.body.append(button);
      });

      const pages = context.pages().length;
      await gallery.click('text=Publish update');
      await gallery.waitForURL(`${GALLERY_URL}publish?draft=*`);
      expect(context.pages()).toHaveLength(pages);
    });

    const draftId = new URL(gallery.url()).searchParams.get('draft');

    expect(
      await postToBridge(
        gallery,
        { type: 'stylebot:draft', id: draftId },
        'stylebot:draft:result'
      )
    ).toMatchObject({
      draft: {
        url: 'example.com',
        css: PUBLISHED_CSS,
        name: 'Mine',
        screenshot: null,
        styleId: 8,
      },
    });
  });

  test('stylebot.dev gets no published status', async ({ context }) => {
    const site = await context.newPage();
    await site.goto(SITE_URL);

    expect(
      await postToBridge(
        site,
        { type: 'stylebot:status', id: 'status', styleIds: [8] },
        'stylebot:status:result'
      )
    ).toMatchObject({ installed: { 8: 'Mine' }, published: {} });
  });
});
