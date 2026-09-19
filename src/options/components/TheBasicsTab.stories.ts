import type { Meta } from '@storybook/vue';

import TheBasicsTab from './TheBasicsTab.vue';
import { optionsPage } from '@stylebot/storybook/mocks/options-page';

const meta: Meta = {
  title: 'Options/Basics',
  component: TheBasicsTab,
  parameters: { padded: false },
};

export default meta;

export const Default = optionsPage('Basics');

export const NoShortcuts = optionsPage('Basics', {
  commands: { style: '', stylebot: '', grayscale: '', readability: '' },
});
