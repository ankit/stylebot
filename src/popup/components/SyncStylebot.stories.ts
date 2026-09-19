import type { Meta } from '@storybook/vue';

import SyncStylebot from './SyncStylebot.vue';
import { popup } from '@stylebot/storybook/mocks/popup';

const meta: Meta = {
  title: 'Browser Action/Sync',
  component: SyncStylebot,
  parameters: { padded: false },
};

export default meta;

export const Enabled = popup({
  storage: { 'google-drive-sync-enabled': true },
});
