import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import SyncStylebot from './SyncStylebot.vue';
import { popup } from '@stylebot/storybook/fixtures/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Sync',
  tags: ['test'],
  component: SyncStylebot,
  parameters: { padded: false },
};

export default meta;

const metadata = {
  id: 'drive-file-id',
  modifiedTime: '2026-01-12T08:00:00Z',
  webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
  webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
};

const syncOn = {
  'google-drive-sync-enabled': true,
  'google-drive-sync-state': {
    remoteRevision: metadata.modifiedTime,
    localRevision: metadata.modifiedTime,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata,
  },
};

export const SyncNow: StoryObj = {
  ...popup({ storage: syncOn, googleDriveSync: { ok: true, metadata } }),
  name: 'Sync now syncs and shows when it last did',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText(/Synced 2 hours ago/)).toBeVisible();

    await user.click(canvas.getByRole('button', { name: 'Sync now' }));

    await expect(await canvas.findByText(/Synced now/)).toBeVisible();
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Sync now' })).toBeEnabled()
    );
  },
};

export const RetriesAfterFailure: StoryObj = {
  ...popup({
    storage: syncOn,
    googleDriveSync: { ok: false, errorKey: 'sync_error_network' },
  }),
  name: 'a failed sync says why, and Sync now tries again',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const syncNow = await canvas.findByRole('button', { name: 'Sync now' });

    await user.click(syncNow);

    await expect(
      await canvas.findByText(/Couldn't reach Google Drive/)
    ).toBeVisible();

    await user.click(syncNow);

    await expect(sendMessage).toHaveBeenCalledTimes(2);
    await expect(sendMessage).toHaveBeenLastCalledWith(
      { name: 'RunGoogleDriveSync', interactive: false },
      expect.any(Function)
    );
  },
};
