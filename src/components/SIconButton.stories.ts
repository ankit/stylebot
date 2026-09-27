import type { Meta } from '@storybook/vue';

import SIconButton from './SIconButton.vue';
import { MoreIcon, SunIcon, InspectorIcon, XIcon } from '@stylebot/icons';
import {
  focusViaTab,
  fromTemplate,
  matrix,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SIconButton',
  component: SIconButton,
  argTypes: {
    bordered: { control: 'boolean' },
    size: { control: { type: 'number', min: 20, max: 48 } },
    tooltip: { control: 'text' },
    icon: {
      control: 'select',
      options: ['more-icon', 'sun-icon', 'inspector-icon', 'x-icon'],
    },
  },
  args: { bordered: false, size: 0, tooltip: 'Action', icon: 'more-icon' },
};

export default meta;

const components = { SIconButton, MoreIcon, SunIcon, InspectorIcon, XIcon };

export const Playground = playground(
  components,
  `
  <s-icon-button
    :bordered="bordered"
    :size="size || undefined"
    :tooltip="tooltip"
  >
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
        `<s-icon-button ${attrs} title="Close"><x-icon :size="16" /></s-icon-button>`,
    },
  ],
});

export const WithTooltip = fromTemplate(
  components,
  `<s-icon-button :size="20" tooltip="Close" tooltip-shortcut="esc">
    <x-icon :size="14" />
  </s-icon-button>`,
  {
    play: async ({ canvasElement }) => {
      focusViaTab(canvasElement);
    },
  }
);
