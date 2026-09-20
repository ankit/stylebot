import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';
import type { SyncState } from '@stylebot/types';

import TheSyncTab from './TheSyncTab.vue';
import { optionsPage } from '@stylebot/storybook/mocks/options-page';
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
