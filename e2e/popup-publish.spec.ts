import type { Page } from '@playwright/test';

import { test, expect } from './fixtures';
import {
  PAGE_URL,
  seedStyles,
  servePage,
  waitForEditorListener,
} from './helpers';

const GALLERY_URL = 'https://gallery.stylebot.dev/';
const OTHER_SITE_URL = 'https://stylebot.dev/';
const DARK_CSS = 'h1 { color: rgb(0, 0, 255); }';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

/**
 * Posts a request the way the gallery's publish page does and resolves with
 * the bridge's reply of the given type, or null when none comes.
 */
const askBridge = (
  page: Page,
  message: Record<string, unknown>,
  replyType: string
) =>
  page.evaluate(
    ([message, replyType]) =>
      new Promise<Record<string, unknown> | null>(resolve => {
        const timer = setTimeout(() => resolve(null), 2000);

        window.addEventListener('message', e => {
          if (e.source === window && e.data?.type === replyType) {
            clearTimeout(timer);
            resolve(e.data);
          }
        });
        window.postMessage(message, location.origin);
      }),
    [message, replyType] as const
  );

const readDraft = (page: Page, id: string) =>
  askBridge(page, { type: 'stylebot:draft', id }, 'stylebot:draft:result');

test("a profile's Publish to Gallery in the popup hands it to the gallery site, which publishes it through the bridge", async ({
  context,
  extension,
  openPopup,
}) => {
  await servePage(context, PAGE_HTML);
  await Promise.all(
    [GALLERY_URL, OTHER_SITE_URL].map(url =>
      context.route(`${url}**`, route =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><body>Gallery</body></html>',
        })
      )
    )
  );
  await seedStyles(extension, {
    localhost: {
      css: 'h1 { color: red; }',
      enabled: true,
      profiles: {
        default: { name: '' },
        dark: { name: 'Dark', css: DARK_CSS },
      },
      activeProfile: 'default',
    },
  });

  const page = await context.newPage();
  await page.goto(PAGE_URL);
  await page.bringToFront();

  const popup = await openPopup();
  await waitForEditorListener(popup);

  const row = popup.locator('.profile-row', { hasText: 'Dark' });
  await row.locator('button[aria-label="Profile actions"]').click();

  await extension.evaluate(() => {
    const worker = self as unknown as { openedUrls: Array<string> };

    worker.openedUrls = [];
    chrome.tabs.onCreated.addListener(tab =>
      worker.openedUrls.push(tab.pendingUrl || tab.url || '')
    );
  });
  await row
    .locator('[role="menuitem"]', { hasText: 'Publish to Gallery' })
    .click();

  let publishUrl = '';
  await expect
    .poll(async () => {
      const opened = await extension.evaluate(
        () => (self as unknown as { openedUrls: Array<string> }).openedUrls
      );

      publishUrl = opened.find(url => url.startsWith(GALLERY_URL)) ?? '';
      return publishUrl;
    })
    .toMatch(/^https:\/\/gallery\.stylebot\.dev\/publish\?draft=[\w-]+$/);

  // Tabs the extension opens skip Playwright's routes, so the stub publish
  // page loads in a page of the test's own.
  const gallery = await context.newPage();
  await gallery.goto(publishUrl);
  const draftId = new URL(publishUrl).searchParams.get('draft') as string;

  await test.step('the page shows the profile, without opening the editor', async () => {
    await expect(page.locator('body > h1')).toHaveCSS(
      'color',
      'rgb(0, 0, 255)'
    );
    await expect(page.locator('#stylebot')).toHaveCount(0);
  });

  await test.step('the publish page reads the draft, as often as it asks', async () => {
    await expect(gallery.locator('html')).toHaveAttribute(
      'data-stylebot-bridge',
      '1'
    );

    const reply = await readDraft(gallery, draftId);
    expect(reply).toMatchObject({
      id: draftId,
      draft: {
        site: 'localhost',
        url: 'localhost',
        css: DARK_CSS,
        name: 'Dark',
        styleId: null,
      },
    });

    const { screenshot } = (reply?.draft ?? {}) as { screenshot?: unknown };
    expect(String(screenshot)).toMatch(/^data:image\/(webp|jpeg);base64,/);
    expect(await readDraft(gallery, draftId)).toMatchObject({
      draft: { name: 'Dark' },
    });
  });

  await test.step("another of Stylebot's sites can't read it", async () => {
    const other = await context.newPage();
    await other.goto(OTHER_SITE_URL);

    expect(await readDraft(other, draftId)).toEqual({
      type: 'stylebot:draft:result',
      id: draftId,
      draft: null,
    });
    await other.close();
  });

  await test.step('publishing records the listing on the profile and ends the draft', async () => {
    expect(
      await askBridge(
        gallery,
        {
          type: 'stylebot:published',
          id: draftId,
          styleId: 7,
          version: 1,
          slug: 'dark',
        },
        'stylebot:published:result'
      )
    ).toEqual({ type: 'stylebot:published:result', id: draftId, ok: true });

    const listing = await extension.evaluate(async () => {
      const { styles } = await chrome.storage.local.get('styles');
      return styles.localhost.profiles.dark.galleryListing;
    });
    expect(listing).toMatchObject({
      styleId: 7,
      version: 1,
      slug: 'dark',
      published: true,
    });

    expect(await readDraft(gallery, draftId)).toMatchObject({ draft: null });
  });

  await test.step('deleting the style on the gallery forgets its listing', async () => {
    expect(
      await askBridge(
        gallery,
        { type: 'stylebot:deleted', id: 7 },
        'stylebot:deleted:result'
      )
    ).toEqual({ type: 'stylebot:deleted:result', id: 7, ok: true });

    const listing = await extension.evaluate(async () => {
      const { styles } = await chrome.storage.local.get('styles');
      return styles.localhost.profiles.dark.galleryListing;
    });
    expect(listing).toBeUndefined();
  });
});
