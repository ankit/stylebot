import type { Meta } from '@storybook/vue';

import SyncStylebot from './SyncStylebot.vue';
import { popup } from '@stylebot/storybook/mocks/popup';

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

export const NeedsSignIn = popup({
  storage: {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': syncState('2026-01-12T08:00:00Z'),
    'google-drive-sync-needs-auth': true,
  },
});
