import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import SyncStylebot from './SyncStylebot.vue';
import { popup } from '@stylebot/storybook/mocks/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Browser Action/Sync',
  component: SyncStylebot,
  parameters: { padded: false },
};

export default meta;

const syncState = (lastSyncedAt: string) => ({
  remoteRevision: lastSyncedAt,
  localRevision: lastSyncedAt,
  lastSyncedAt,
  metadata: {
    id: 'drive-file-id',
    modifiedTime: lastSyncedAt,
    webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
    webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
  },
});

export const Synced = popup({
  storage: {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': syncState('2026-01-12T08:00:00Z'),
  },
});

export const NeverSynced = popup({
  storage: { 'google-drive-sync-enabled': true },
});

export const NeedsSignIn = popup({
  storage: {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': syncState('2026-01-12T08:00:00Z'),
    'google-drive-sync-needs-auth': true,
  },
});

// A play, not a seeded state: syncInProgress lives only in the component's
// own data, so the "syncing" and "error" states can only be reached by
// actually clicking the button.
export const SyncInProgress: StoryObj = {
  ...popup({
    storage: { 'google-drive-sync-enabled': true },
    googleDriveSync: 'pending',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole('button', { name: 'Sync' }));
    await waitFor(() => expect(canvas.getByText('Syncing...')).toBeVisible());
  },
};

export const SyncFailed: StoryObj = {
  ...popup({
    storage: { 'google-drive-sync-enabled': true },
    googleDriveSync: { ok: false, errorKey: 'sync_error_network' },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole('button', { name: 'Sync' }));
    await waitFor(() =>
      expect(
        canvas.getByText(
          "Couldn't reach Google Drive. Check your connection and try again."
        )
      ).toBeVisible()
    );
  },
};
