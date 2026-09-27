import type { Meta } from '@storybook/vue';

import ManageAllStyles from './ManageAllStyles.vue';
import { popup } from '@stylebot/storybook/mocks/popup';

const meta: Meta = {
  title: 'Browser Action/Restricted Page',
  component: ManageAllStyles,
  parameters: { padded: false },
};

export default meta;

export const ChromeUrl = popup({ tabUrl: 'chrome://extensions' });

export const WebStore = popup({
  tabUrl: 'https://chrome.google.com/webstore/detail/stylebot',
});
