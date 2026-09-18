import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const metadata = {
  id: 'file-id',
  modifiedTime: '2024-01-01T00:00:00.000Z',
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
};

const syncState = (lastSyncedAt: string) => ({
  metadata,
  remoteRevision: metadata.modifiedTime,
  localRevision: 'local-1',
  lastSyncedAt,
});

/**
 * Seeds storage from the options page rather than the service worker: MV3 tears
 * the worker down when idle, so a worker handle can go stale between tests,
 * whereas an extension page has the same chrome.storage access and is alive by
 * definition. Reloads afterwards so the Vue app reads the seeded values.
 */
const openSyncTab = async (
  page: Page,
  extensionId: string,
  items: Record<string, unknown>
): Promise<void> => {
  const optionsUrl = `chrome-extension://${extensionId}/options/index.html`;

  await page.goto(optionsUrl);
  await page.evaluate(seeded => chrome.storage.local.set(seeded), items);
  await page.reload();

  await page.getByRole('button', { name: 'Sync', exact: true }).click();
  await page.getByRole('heading', { name: 'Sync', exact: true }).waitFor();
};

const readStorage = (page: Page, keys: string[]) =>
  page.evaluate(names => chrome.storage.local.get(names), keys);

test.describe('Sync tab', () => {
  test('renders the Google Drive card when sync has never been set up', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extensionId, {
      'google-drive-sync-enabled': false,
    });

    await expect(
      page.getByText('Not connected. Styles stay on this computer only.')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enable Google Drive Sync' })
    ).toBeVisible();
  });

  // Regression test: the card used to call date-fns' formatDistanceToNow on the
  // stored timestamp unguarded, so malformed state threw RangeError and took
  // the whole options page down with it.
  test('renders the card even when the stored sync timestamp is unparseable', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await openSyncTab(page, extensionId, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState('not-a-date'),
    });

    await expect(
      page.getByRole('heading', { name: 'Google Drive' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Disable Google Drive Sync' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'View' })).toBeVisible();
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('shows how long ago the last sync happened', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();

    await openSyncTab(page, extensionId, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(
        new Date(Date.now() - 60 * 60 * 1000).toISOString()
      ),
    });

    await expect(page.getByText(/Synced about 1 hour ago/)).toBeVisible();
  });

  // Enabling also kicks off a sync, which parks on the OAuth consent window —
  // it has nothing to click here, and the unpacked build's extension id does
  // not match the registered redirect anyway. So this asserts the flag and the
  // in-progress state only; the failure path is covered by the unit tests and
  // TheSyncTab's component test, which do not need a real Drive.
  test('persists the enabled flag and shows a sync in progress', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extensionId, {
      'google-drive-sync-enabled': false,
    });

    await page
      .getByRole('button', { name: 'Enable Google Drive Sync' })
      .dispatchEvent('click');

    await expect(
      page.getByRole('button', { name: 'Disable Google Drive Sync' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Syncing...' })
    ).toBeDisabled();

    await expect
      .poll(async () =>
        (await readStorage(page, ['google-drive-sync-enabled']))[
          'google-drive-sync-enabled'
        ]
      )
      .toBe(true);
  });

  test('clears the stored sync state when sync is turned off', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    const keys = [
      'google-drive-sync-state',
      'google-drive-sync',
      'google-drive-access-token',
    ];

    await openSyncTab(page, extensionId, {
      'google-drive-sync-enabled': true,
      'google-drive-sync': metadata,
      'google-drive-sync-state': syncState(new Date().toISOString()),
      'google-drive-access-token': { token: 'cached', expiresAt: Date.now() },
    });

    await page
      .getByRole('button', { name: 'Disable Google Drive Sync' })
      .dispatchEvent('click');

    await expect(
      page.getByRole('button', { name: 'Enable Google Drive Sync' })
    ).toBeVisible();

    await expect
      .poll(async () => Object.keys(await readStorage(page, keys)))
      .toEqual([]);
  });
});
