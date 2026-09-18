import { test, expect } from './fixtures';
import type { BrowserContext, Page } from '@playwright/test';

const seedSync = async (
  context: BrowserContext,
  enabled: boolean,
  metadata?: Record<string, unknown>
): Promise<void> => {
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

  await worker.evaluate(
    ([isEnabled, syncMetadata]) =>
      chrome.storage.local.set({
        'google-drive-sync-enabled': isEnabled,
        ...(syncMetadata ? { 'google-drive-sync': syncMetadata } : {}),
      }),
    [enabled, metadata ?? null] as [boolean, Record<string, unknown> | null]
  );
};

const openSyncTab = async (page: Page, extensionId: string): Promise<void> => {
  await page.goto(`chrome-extension://${extensionId}/options/index.html`);
  await page.getByRole('button', { name: 'Sync', exact: true }).click();
  await page.getByRole('heading', { name: 'Sync', exact: true }).waitFor();
};

test.describe('Sync tab', () => {
  test('renders the Google Drive card when sync has never been set up', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await seedSync(context, false);
    await openSyncTab(page, extensionId);

    await expect(
      page.getByText('Not connected. Styles stay on this computer only.')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enable Google Drive Sync' })
    ).toBeVisible();
  });

  // Regression test: the card used to call date-fns' formatDistanceToNow on the
  // stored timestamp unguarded, so malformed metadata threw RangeError and took
  // the whole options page down with it.
  test('renders the card even when the stored sync timestamp is unparseable', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await seedSync(context, true, {
      id: 'file-id',
      modifiedTime: 'not-a-date',
      webViewLink: 'https://drive.google.com/view',
      webContentLink: 'https://drive.google.com/download',
    });

    await openSyncTab(page, extensionId);

    await expect(page.getByRole('heading', { name: 'Google Drive' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Disable Google Drive Sync' })
    ).toBeVisible();
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('persists the enabled flag when sync is turned on', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await seedSync(context, false);
    await openSyncTab(page, extensionId);

    await page
      .getByRole('button', { name: 'Enable Google Drive Sync' })
      .dispatchEvent('click');

    await expect(
      page.getByRole('button', { name: 'Disable Google Drive Sync' })
    ).toBeVisible();

    const worker = context.serviceWorkers()[0];
    const enabled = await worker.evaluate(() =>
      chrome.storage.local
        .get('google-drive-sync-enabled')
        .then(items => items['google-drive-sync-enabled'])
    );

    expect(enabled).toBe(true);
  });
});
