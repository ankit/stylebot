import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';
import type { SyncState } from '@stylebot/types';

import TheSyncTab from './TheSyncTab.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Sync',
  tags: ['test'],
  component: TheSyncTab,
  parameters: { padded: false },
};

export default meta;

const metadata = {
  id: 'drive-file-id',
  modifiedTime: '2026-01-12T08:00:00Z',
  webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
  webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
};

/**
 * Answers the next file picker with a file holding `contents`, since a story
 * can't drive the browser's own file chooser.
 */
const chooseFileOnNextPicker = (contents: unknown) => {
  const click = HTMLInputElement.prototype.click;

  HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
    HTMLInputElement.prototype.click = click;

    const transfer = new DataTransfer();
    transfer.items.add(
      new File([JSON.stringify(contents)], 'stylebot_backup.json', {
        type: 'application/json',
      })
    );
    this.files = transfer.files;
    this.dispatchEvent(new Event('change'));
  };
};

const backup = (styles: Record<string, unknown>) => ({
  format: 'stylebot-backup',
  version: 1,
  exportedAt: '2026-10-01T00:00:00Z',
  styles,
});

const syncState = (overrides: Partial<SyncState> = {}): SyncState => ({
  remoteRevision: metadata.modifiedTime,
  localRevision: metadata.modifiedTime,
  lastSyncedAt: '2026-01-12T08:00:00Z',
  metadata,
  ...overrides,
});

export const ConnectRunsAnImmediateSync: StoryObj = {
  ...optionsPage('Sync', {}, async root => {
    const canvas = within(root);

    await user.click(canvas.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(canvas.getByText(/^Synced/)).toBeVisible());
    await expect(
      canvas.getByRole('button', { name: 'Sync now' })
    ).toBeEnabled();
  }),
  name: 'connecting runs a sync right away and shows the synced pill',
  parameters: { chrome: { googleDriveSync: { ok: true, metadata } } },
};

export const FailedSyncShowsAnErrorBanner: StoryObj = {
  ...optionsPage(
    'Sync',
    { googleDriveSyncEnabled: true, googleDriveSyncState: syncState() },
    async root => {
      const canvas = within(root);

      await user.click(canvas.getByRole('button', { name: 'Sync now' }));
      await waitFor(() =>
        expect(
          canvas.getByText(
            "Couldn't sign in to Google Drive. Reconnect and try again."
          )
        ).toBeVisible()
      );
      await expect(
        canvas.getByRole('button', { name: 'Sync now' })
      ).toBeEnabled();
    }
  ),
  name: 'a failed sync shows an error banner and re-enables Sync now',
  parameters: {
    chrome: { googleDriveSync: { ok: false, errorKey: 'sync_error_auth' } },
  },
};

export const DismissingAConflictRemovesIt: StoryObj = {
  ...optionsPage(
    'Sync',
    {
      googleDriveSyncEnabled: true,
      googleDriveSyncState: syncState({
        conflicts: [
          { url: 'example.com', at: '2026-01-12T08:00:00Z' },
          { url: 'news.example.com/**', at: '2026-01-11T20:00:00Z' },
        ],
      }),
    },
    async root => {
      const canvas = within(root);

      await expect(canvas.getByText('example.com')).toBeInTheDocument();
      await expect(canvas.getByText('news.example.com/**')).toBeInTheDocument();

      const [dismissFirst] = canvas.getAllByRole('button', {
        name: 'Dismiss',
      });
      await user.click(dismissFirst);

      await waitFor(() => expect(canvas.queryByText('example.com')).toBeNull());
      await expect(canvas.getByText('news.example.com/**')).toBeInTheDocument();
    }
  ),
  name: 'dismissing a conflict drops it from the list and leaves the rest',
};

export const DisconnectingShowsTheConnectOptionAgain: StoryObj = {
  ...optionsPage(
    'Sync',
    { googleDriveSyncEnabled: true, googleDriveSyncState: syncState() },
    async root => {
      const canvas = within(root);

      await user.click(canvas.getByRole('button', { name: 'Disconnect' }));

      await waitFor(() =>
        expect(canvas.getByText('Not connected')).toBeVisible()
      );
      await expect(
        canvas.getByRole('button', { name: 'Connect' })
      ).toBeVisible();
    }
  ),
  name: 'disconnecting drops the card back to the not-connected state',
};

export const MergingABackupKeepsLocalStyles: StoryObj = {
  ...optionsPage('Sync', { styles: seededStyles }, async root => {
    const canvas = within(root);

    chooseFileOnNextPicker(
      backup({
        'example.com': {
          ...seededStyles['example.com'],
          css: 'h1 { color: blue; }',
        },
        'new.example.net': {
          css: 'body { margin: 0; }',
          enabled: true,
          readability: false,
          modifiedTime: '2026-09-01T00:00:00Z',
        },
      })
    );
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    const dialog = await canvas.findByRole('heading', {
      name: 'Import backup',
    });
    await expect(dialog).toBeVisible();
    await expect(canvas.getByText('1 new style')).toBeVisible();
    await expect(
      canvas.getByText('1 style that differs from yours')
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "You have 3 styles that aren't in this backup. Merge keeps them; Replace all deletes them."
      )
    ).toBeVisible();

    await user.click(canvas.getByRole('button', { name: 'Merge' }));

    await waitFor(() =>
      expect(canvas.getByText(/^Imported 2 styles\./)).toBeVisible()
    );
    await expect(
      canvas.queryByRole('heading', { name: 'Import backup' })
    ).toBeNull();
  }),
  name: 'merging a backup counts what it adds and changes, then confirms the import',
};

export const AnEmptyBackupIsRejected: StoryObj = {
  ...optionsPage('Sync', { styles: seededStyles }, async root => {
    const canvas = within(root);

    chooseFileOnNextPicker({});
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    await waitFor(() =>
      expect(
        canvas.getByText('Could not import styles - The backup has no styles')
      ).toBeVisible()
    );
    await expect(
      canvas.queryByRole('heading', { name: 'Import backup' })
    ).toBeNull();
  }),
  name: 'an empty backup shows an error instead of offering to replace every style',
};

export const CancellingAnImportChangesNothing: StoryObj = {
  ...optionsPage('Sync', { styles: seededStyles }, async root => {
    const canvas = within(root);

    chooseFileOnNextPicker(backup(seededStyles));
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    await expect(
      await canvas.findByText('Everything in this backup matches your styles.')
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Merge' })).toBeDisabled();
    await expect(
      canvas.queryByRole('button', { name: 'Replace all' })
    ).toBeNull();

    await user.click(canvas.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(
        canvas.queryByRole('heading', { name: 'Import backup' })
      ).toBeNull()
    );
    await expect(canvas.queryByText(/^Imported/)).toBeNull();
  }),
  name: 'a backup matching every style offers nothing to merge and cancels cleanly',
};

export const DismissingAnImportBannerHidesIt: StoryObj = {
  ...optionsPage('Sync', { styles: seededStyles }, async root => {
    const canvas = within(root);

    chooseFileOnNextPicker({});
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    const error = 'Could not import styles - The backup has no styles';
    await waitFor(() => expect(canvas.getByText(error)).toBeVisible());

    await user.click(canvas.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => expect(canvas.queryByText(error)).toBeNull());
  }),
  name: 'dismissing an import error banner removes it',
};

export const StartingAnImportClearsTheLastBanner: StoryObj = {
  ...optionsPage('Sync', { styles: seededStyles }, async root => {
    const canvas = within(root);

    chooseFileOnNextPicker({});
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    const error = 'Could not import styles - The backup has no styles';
    await waitFor(() => expect(canvas.getByText(error)).toBeVisible());

    chooseFileOnNextPicker(backup(seededStyles));
    await user.click(canvas.getByRole('button', { name: 'Import' }));

    await canvas.findByRole('heading', { name: 'Import backup' });
    await expect(canvas.queryByText(error)).toBeNull();
  }),
  name: 'starting a new import clears the previous import banner',
};
