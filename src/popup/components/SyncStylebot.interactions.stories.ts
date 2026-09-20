import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import SyncStylebot from './SyncStylebot.vue';
import { popup } from '@stylebot/storybook/mocks/popup';
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

export const SuccessfulSyncRefreshesTheTimestamp: StoryObj = {
  ...popup({
    storage: { 'google-drive-sync-enabled': true },
    googleDriveSync: { ok: true, metadata },
  }),
  name: 'a successful sync re-enables the button and shows when it happened',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', { name: 'Sync' });

    await expect(canvas.getByText('Not synced yet')).toBeInTheDocument();

    await user.click(button);

    await waitFor(() =>
      expect(canvas.getByText(/^Synced/)).toBeInTheDocument()
    );
    await expect(button).toBeEnabled();
  },
};

export const FailedSyncReenablesTheButton: StoryObj = {
  ...popup({
    storage: { 'google-drive-sync-enabled': true },
    googleDriveSync: { ok: false, errorKey: 'sync_error_not_found' },
  }),
  name: 'a failed sync shows the error and re-enables the button',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', { name: 'Sync' });

    await user.click(button);

    await waitFor(() =>
      expect(
        canvas.getByText("Couldn't find the synced file on Google Drive.")
      ).toBeInTheDocument()
    );
    await expect(button).toBeEnabled();
    await expect(canvasElement.querySelector('.sync-strip')).toHaveClass(
      'error'
    );
  },
};

export const SigningInClearsTheSignInPrompt: StoryObj = {
  ...popup({
    storage: {
      'google-drive-sync-enabled': true,
      'google-drive-sync-needs-auth': true,
    },
    googleDriveSync: { ok: true, metadata },
  }),
  name: 'a successful sync clears a pending sign-in prompt',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText('Sign in to Google Drive to resume syncing.')
    ).toBeInTheDocument();

    await user.click(canvas.getByRole('button', { name: 'Sync' }));

    await waitFor(() =>
      expect(canvas.getByText(/^Synced/)).toBeInTheDocument()
    );
    await expect(
      canvas.queryByText('Sign in to Google Drive to resume syncing.')
    ).toBeNull();
  },
};
