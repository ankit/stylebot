import type { Meta } from '@storybook/vue';
import type { SyncState } from '@stylebot/types';

import TheSyncTab from './TheSyncTab.vue';
import { optionsPage } from '@stylebot/storybook/mocks/options-page';

const meta: Meta = {
  title: 'Options/Sync',
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

export const Default = optionsPage('Sync');

export const Connected = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncState: syncState({
    account: { email: 'ada@example.com' },
  }),
});

export const NeedsSignIn = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncState: syncState(),
  googleDriveSyncNeedsAuth: true,
});

export const SyncInProgress = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncState: syncState(),
  syncInProgress: true,
});

export const SyncFailed = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncState: syncState(),
  syncStatus: {
    type: 'error',
    messageKey: 'sync_error_network',
  },
});

export const Conflicts = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncState: syncState({
    conflicts: [
      { url: 'example.com', at: '2026-01-12T08:00:00Z' },
      { url: 'news.example.com/**', at: '2026-01-11T20:00:00Z' },
    ],
  }),
});
