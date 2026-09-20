import { test, expect, type Extension } from './fixtures';
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
  extension: Extension,
  items: Record<string, unknown>
): Promise<void> => {
  const optionsUrl = `chrome-extension://${extension.id}/options.html`;

  await page.goto(optionsUrl);
  await page.evaluate(seeded => chrome.storage.local.set(seeded), items);
  await page.reload();

  await page.getByRole('button', { name: 'Sync', exact: true }).click();
  await page.getByRole('heading', { name: 'Sync', exact: true }).waitFor();
};

const readStorage = (page: Page, keys: Array<string>) =>
  page.evaluate(names => chrome.storage.local.get(names), keys);

test.describe('Sync tab', () => {
  test('renders the Google Drive card when sync has never been set up', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': false,
    });

    await expect(
      page.getByText('Not connected', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(/Saves stylebot_v3_backup\.json to your Drive/)
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Connect', exact: true })
    ).toBeVisible();
  });

  // Regression test: the card used to call date-fns' formatDistanceToNow on the
  // stored timestamp unguarded, so malformed state threw RangeError and took
  // the whole options page down with it.
  test('renders the card even when the stored sync timestamp is unparseable', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    const pageErrors: Array<string> = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState('not-a-date'),
    });

    await expect(page.getByText('Connected to Google Drive')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Disconnect' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /stylebot\/stylebot_v3_backup\.json/ })
    ).toBeVisible();
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('shows how long ago the last sync happened', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();

    await openSyncTab(page, extension, {
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
    extension,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': false,
    });

    await page
      .getByRole('button', { name: 'Connect', exact: true })
      .dispatchEvent('click');

    await expect(
      page.getByRole('button', { name: 'Disconnect' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sync now' })).toBeDisabled();
    await expect(page.getByText('Syncing...')).toBeVisible();

    await expect
      .poll(
        async () =>
          (
            await readStorage(page, ['google-drive-sync-enabled'])
          )['google-drive-sync-enabled']
      )
      .toBe(true);
  });

  test('clears the stored sync state when sync is turned off', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    const keys = [
      'google-drive-sync-state',
      'google-drive-sync',
      'google-drive-access-token',
    ];

    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync': metadata,
      'google-drive-sync-state': syncState(new Date().toISOString()),
      'google-drive-access-token': { token: 'cached', expiresAt: Date.now() },
    });

    await page
      .getByRole('button', { name: 'Disconnect' })
      .dispatchEvent('click');

    await expect(
      page.getByRole('button', { name: 'Connect', exact: true })
    ).toBeVisible();

    await expect
      .poll(async () => Object.keys(await readStorage(page, keys)))
      .toEqual([]);
  });

  test('updates the synced-at line when a background sync writes new state', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();

    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(
        new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      ),
    });

    await expect(page.getByText(/Synced about 3 hours ago/)).toBeVisible();

    // What a scheduled run does from the service worker while the page is open.
    await page.evaluate(
      state => chrome.storage.local.set({ 'google-drive-sync-state': state }),
      syncState(new Date().toISOString())
    );

    await expect(page.getByText(/Synced less than a minute ago/)).toBeVisible();
  });

  test('asks for a sign-in when a scheduled sync could not get a token', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();

    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': true,
      'google-drive-sync-state': syncState(new Date().toISOString()),
      'google-drive-sync-needs-auth': true,
    });

    await expect(
      page.getByText('Sign in to Google Drive to resume syncing.')
    ).toBeVisible();
    await expect(page.getByText(/Synced .* ago/)).toHaveCount(0);
  });

  test('lists merge conflicts, opens the style to review, and dismisses it', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    const css =
      'a { color: blue; }\n\n/* Stylebot sync conflict on 2026-09-18: another device had\na { color: green; }\n*/\n';

    await openSyncTab(page, extension, {
      'google-drive-sync-enabled': true,
      styles: {
        'example.com': {
          css,
          enabled: true,
          readability: false,
          modifiedTime: '2026-09-18T00:00:00.000Z',
        },
      },
      'google-drive-sync-state': {
        ...syncState(new Date().toISOString()),
        conflicts: [{ url: 'example.com', at: '2026-09-18T00:00:00.000Z' }],
      },
    });

    const notice = page.getByText('Edits from another device were merged');
    await expect(notice).toBeVisible();
    await expect(page.getByText('example.com', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Review' }).click();

    // Review jumps to the Styles tab with that style open for editing.
    await expect(page.locator('input.url-input')).toHaveValue('example.com');

    await page.getByRole('button', { name: 'Sync', exact: true }).click();
    await page.getByRole('button', { name: 'Dismiss' }).click();

    await expect(notice).toHaveCount(0);
    await expect
      .poll(async () => {
        const items = await readStorage(page, ['google-drive-sync-state']);
        return (
          items['google-drive-sync-state'] as { conflicts: Array<unknown> }
        ).conflicts;
      })
      .toEqual([]);
  });
});
