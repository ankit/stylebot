import type { Meta } from '@storybook/vue';

import SIconButton from './SIconButton.vue';
import { MoreIcon, SunIcon, InspectorIcon, IconX } from '@stylebot/icons';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SIconButton',
  component: SIconButton,
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

const components = { SIconButton, MoreIcon, SunIcon, InspectorIcon, IconX };

export const Playground = playground(
  components,
  `
  <s-icon-button :bordered="bordered" :size="size || undefined" title="Action">
    <component :is="icon" :size="16" />
  </s-icon-button>
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
        `<s-icon-button ${attrs} title="More"><more-icon :size="16" /></s-icon-button>`,
    },
    {
      label: 'Appearance',
      cell: attrs =>
        `<s-icon-button ${attrs} title="Appearance"><sun-icon :size="16" /></s-icon-button>`,
    },
    {
      label: 'Close',
      cell: attrs =>
        `<s-icon-button ${attrs} title="Close"><icon-x :size="16" /></s-icon-button>`,
    },
  ],
});
