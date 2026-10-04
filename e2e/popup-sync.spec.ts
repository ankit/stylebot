import { test, expect, type Extension } from './fixtures';
import { startTestServer } from './helpers';
import type { BrowserContext } from '@playwright/test';

const PAGE_HTML = `<!doctype html><html><body><h1>Test page</h1></body></html>`;

let baseUrl: string;
let closePageServer: () => Promise<void>;

test.beforeAll(async () => {
  ({ baseUrl, close: closePageServer } = await startTestServer({
    '/': PAGE_HTML,
  }));
});

test.afterAll(() => closePageServer());

const syncState = (lastSyncedAt: string) => ({
  metadata: {
    id: 'file-id',
    modifiedTime: '2024-01-01T00:00:00.000Z',
    webViewLink: 'https://drive.google.com/view',
    webContentLink: 'https://drive.google.com/download',
  },
  remoteRevision: '2024-01-01T00:00:00.000Z',
  localRevision: 'local-1',
  lastSyncedAt,
});

/**
 * Seeds storage through the background, then makes a real page the active
 * tab so the popup renders its main view rather than the restricted one.
 */
const seedAndFocusPage = async (
  context: BrowserContext,
  extension: Extension,
  items: Record<string, unknown>
) => {
  await extension.evaluate(seeded => chrome.storage.local.set(seeded), items);

  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.bringToFront();
};

test.describe('popup sync strip', () => {
  test('is absent when sync is off', async ({
    context,
    extension,
    openPopup,
  }) => {
    await seedAndFocusPage(context, extension, {
      'google-drive-sync-enabled': false,
    });

    const popup = await openPopup();

    await expect
      .poll(() => popup.locator('.popup-footer').isVisible())
      .toBe(true);
    expect(await popup.locator('.sync-strip').isVisible()).toBe(false);
  });

  test('syncs on open without an auth window, then asks for a sign-in when there is no token', async ({
    context,
    extension,
    openPopup,
  }) => {
    await seedAndFocusPage(context, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(new Date().toISOString()),
    });

    const popup = await openPopup();

    // Only a non-interactive run leaves this flag; an interactive one would
    // have opened a sign-in tab instead.
    await expect
      .poll(() =>
        popup
          .locator('.sync-strip', { hasText: 'Sign in to keep syncing' })
          .isVisible()
      )
      .toBe(true);
    expect(
      await extension.evaluate(
        async () =>
          (
            await chrome.storage.local.get('google-drive-sync-needs-auth')
          )['google-drive-sync-needs-auth']
      )
    ).toBe(true);
  });

  test('asks for a sign-in when a scheduled sync could not get a token, and opens the Sync tab', async ({
    context,
    extension,
    openPopup,
  }) => {
    await seedAndFocusPage(context, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(new Date().toISOString()),
      'google-drive-sync-needs-auth': true,
    });

    const popup = await openPopup();

    await expect
      .poll(() =>
        popup
          .locator('.sync-strip', {
            hasText: 'Sign in to keep syncing',
          })
          .isVisible()
      )
      .toBe(true);

    const opened = context.waitForEvent('page');
    await popup.locator('.sync-button', { hasText: 'Sign in' }).click();
    const options = await opened;

    await expect.poll(() => options.url()).toMatch(/options\.html#\/sync$/);
  });
});
