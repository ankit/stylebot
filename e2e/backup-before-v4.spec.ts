import { test, expect } from './fixtures';

const stylesBeforeV4 = {
  'example.com': {
    css: 'a { color: red; }',
    enabled: true,
    readability: false,
    modifiedTime: '2026-09-01T10:00:00.000Z',
  },
};

test('the background backs up storage once it starts', async ({
  extension,
}) => {
  await expect
    .poll(() =>
      extension.evaluate(async () => {
        const items = await chrome.storage.local.get('backup_before_v4');
        return Boolean(items.backup_before_v4?.createdAt);
      })
    )
    .toBe(true);
});

test.describe('restoring styles from before 4.0', () => {
  test.skip(
    ({ engine }) => !engine.opensExtensionPages,
    "Playwright can't open the options page as a page on this engine"
  );

  test('puts the backed up styles back in storage', async ({
    context,
    extension,
  }) => {
    await extension.evaluate(async styles => {
      await chrome.storage.local.set({
        backup_before_v4: {
          createdAt: '2026-10-01T10:00:00.000Z',
          items: { styles },
        },
      });
    }, stylesBeforeV4);

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extension.id}/options.html#/sync`);
    await page
      .getByRole('button', { name: 'Restore styles from before 4.0' })
      .click();

    await expect(
      page.getByText('Your styles have been restored from the backup.')
    ).toBeVisible();
    await expect
      .poll(() =>
        extension.evaluate(async () => {
          const { styles } = await chrome.storage.local.get('styles');
          return styles?.['example.com']?.css;
        })
      )
      .toBe(stylesBeforeV4['example.com'].css);
  });
});
