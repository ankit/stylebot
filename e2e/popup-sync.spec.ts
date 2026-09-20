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
 * Seeds storage from an extension page, then makes a real page the active
 * tab so the popup renders its main view rather than the restricted one.
 */
const seedAndFocusPage = async (
  context: BrowserContext,
  extension: Extension,
  items: Record<string, unknown>
) => {
  const seed = await context.newPage();
  await seed.goto(`chrome-extension://${extension.id}/options.html`);
  await seed.evaluate(seeded => chrome.storage.local.set(seeded), items);
  await seed.close();

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

  test('reports the last sync and offers a Sync button when on', async ({
    context,
    extension,
    openPopup,
  }) => {
    await seedAndFocusPage(context, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(
        new Date(Date.now() - 6 * 60 * 1000).toISOString()
      ),
    });

    const popup = await openPopup();

    await expect
      .poll(() =>
        popup
          .locator('.sync-strip', { hasText: /Synced 6 minutes ago/ })
          .isVisible()
      )
      .toBe(true);
    expect(
      await popup.locator('.sync-button', { hasText: 'Sync' }).isVisible()
    ).toBe(true);
  });

  test('asks for a sign-in when a scheduled sync could not get a token', async ({
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
            hasText: 'Sign in to Google Drive to resume syncing.',
          })
          .isVisible()
      )
      .toBe(true);
  });
});
