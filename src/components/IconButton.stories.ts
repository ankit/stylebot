import type { Meta } from '@storybook/vue';

import IconButton from './IconButton.vue';
import { MoreIcon, SunIcon, InspectorIcon, IconX } from '@stylebot/icons';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/IconButton',
  component: IconButton,
  argTypes: {
    bordered: { control: 'boolean' },
    size: { control: { type: 'number', min: 20, max: 48 } },
    icon: {
      control: 'select',
      options: ['more-icon', 'sun-icon', 'inspector-icon', 'icon-x'],
    },
  },
  args: { bordered: false, size: 0, icon: 'more-icon' },
};

export default meta;

const components = { IconButton, MoreIcon, SunIcon, InspectorIcon, IconX };

export const Playground = playground(
  components,
  `
  <icon-button :bordered="bordered" :size="size || undefined" title="Action">
    <component :is="icon" :size="16" />
  </icon-button>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'default', attrs: '' },
    { label: 'bordered', attrs: 'bordered' },
    { label: 'bordered 26', attrs: 'bordered :size="26"' },
  ],
  columns: [
    {
      label: 'More',
      cell: attrs =>
        `<icon-button ${attrs} title="More"><more-icon :size="16" /></icon-button>`,
    },
    {
      label: 'Appearance',
      cell: attrs =>
        `<icon-button ${attrs} title="Appearance"><sun-icon :size="16" /></icon-button>`,
    },
    {
      label: 'Close',
      cell: attrs =>
        `<icon-button ${attrs} title="Close"><icon-x :size="22" /></icon-button>`,
    },
  ],
});
