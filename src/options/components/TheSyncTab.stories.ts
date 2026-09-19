import type { Meta } from '@storybook/vue';

import TheSyncTab from './TheSyncTab.vue';
import { optionsPage } from '@stylebot/storybook/mocks/options-page';

const meta: Meta = {
  title: 'Options/Sync',
  component: TheSyncTab,
  parameters: { padded: false },
};

export default meta;

export const Default = optionsPage('Sync');

export const GoogleDriveConnected = optionsPage('Sync', {
  googleDriveSyncEnabled: true,
  googleDriveSyncMetadata: {
    id: 'drive-file-id',
    modifiedTime: '2026-01-12T08:00:00Z',
    webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
    webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
  },
});
