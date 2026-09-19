import type { Meta } from '@storybook/vue';

import STabs from './STabs.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Navigation/STabs',
  component: STabs,
  argTypes: {
    value: { control: 'radio', options: ['basic', 'magic', 'code'] },
  },
  args: { value: 'magic' },
};

export default meta;

const MODE_TABS = [
  { value: 'basic', label: 'Basic', title: 'Basic mode', shortcut: 'b' },
  { value: 'magic', label: 'Magic', title: 'Magic mode', shortcut: 'm' },
  { value: 'code', label: 'Code', title: 'Code mode', shortcut: 'c' },
];

export const Playground = playground(
  { STabs },
  `<s-tabs :tabs="tabs" :value="value" />`,
  () => ({ tabs: MODE_TABS })
);

export const Variants = fromTemplate(
  { STabs },
  `
  <div class="sb-stack">
    <s-tabs :tabs="modeTabs" :value="mode" @change="mode = $event" />
    <s-tabs :tabs="colorTabs" :value="color" @change="color = $event" />
  </div>
`,
  {
    data: () => ({
      mode: 'magic',
      modeTabs: MODE_TABS,
      color: 'used',
      colorTabs: [
        { value: 'used', label: 'Your colors' },
        { value: 'palette', label: 'Palette' },
        { value: 'custom', label: 'Custom', disabled: true },
      ],
    }),
  }
);
