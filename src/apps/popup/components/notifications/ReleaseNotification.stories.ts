import type { Meta } from '@storybook/vue';

import ReleaseNotification from './ReleaseNotification.vue';
import { popup } from '@stylebot/storybook/mocks/popup';

const meta: Meta = {
  title: 'Browser Action/Release Notification',
  component: ReleaseNotification,
  parameters: { padded: false },
};

export default meta;

export const Unseen = popup({
  storage: { 'notification~release/3.2': false },
});
