import { readFile } from 'node:fs/promises';

import { test, expect, type Extension } from './fixtures';
import type { Page } from '@playwright/test';

const style = (css: string) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
});

/**
 * Seeds styles from the options page, then reloads it on the Sync tab so the
 * Vue app reads them, as sync-tab.spec.ts does.
 */
const openSyncTab = async (
  page: Page,
  extension: Extension,
  styles: Record<string, unknown>
): Promise<void> => {
  await page.goto(`chrome-extension://${extension.id}/options.html`);
  await page.evaluate(seeded => chrome.storage.local.set(seeded), { styles });
  await page.reload();

  await page.getByRole('button', { name: 'Sync', exact: true }).click();
  await page.getByRole('heading', { name: 'Backup', exact: true }).waitFor();
};

const readStyles = (page: Page) =>
  page.evaluate(async () => (await chrome.storage.local.get('styles')).styles);

test.describe('Backup', () => {
  test.skip(
    ({ engine }) => !engine.opensExtensionPages,
    "Playwright can't open the options page as a page on this engine"
  );

  test('exports a versioned backup of every style', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extension, { 'example.com': style('a {}') });

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const backup = JSON.parse(
      await readFile((await (await download).path()) as string, 'utf8')
    );

    expect(backup).toMatchObject({
      format: 'stylebot-backup',
      version: 1,
      styles: { 'example.com': style('a {}') },
    });
  });

  test('merging a backup keeps styles it lacks and stores the rest', async ({
    context,
    extension,
  }) => {
    const page = await context.newPage();
    await openSyncTab(page, extension, {
      'example.com': style('a {}'),
      'local.example.org': style('b {}'),
    });

    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await (
      await chooser
    ).setFiles({
      name: 'stylebot_backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          'example.com': style('a { color: red; }'),
          'new.example.net': style('c {}'),
        })
      ),
    });

    await page.getByRole('button', { name: 'Merge', exact: true }).click();
    await expect(page.getByText('Imported 2 styles.')).toBeVisible();

    await expect
      .poll(async () => Object.keys(await readStyles(page)).sort())
      .toEqual(['example.com', 'local.example.org', 'new.example.net']);
    expect((await readStyles(page))['example.com'].css).toBe(
      'a { color: red; }'
    );
  });
});
