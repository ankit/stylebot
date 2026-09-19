import type { Meta } from '@storybook/vue';

import STabs from './STabs.vue';
import { fromTemplate } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/STabs',
  component: STabs,
};

export default meta;

export const Default = fromTemplate(
  { STabs },
  `<s-tabs :tabs="tabs" :value="value" @change="value = $event" />`,
  {
    data: () => ({
      value: 'magic',
      tabs: [
        { value: 'basic', label: 'Basic', title: 'Basic mode', shortcut: 'b' },
        { value: 'magic', label: 'Magic', title: 'Magic mode', shortcut: 'm' },
        { value: 'code', label: 'Code', title: 'Code mode', shortcut: 'c' },
      ],
    }),
  }
);

export const WithDisabled = fromTemplate(
  { STabs },
  `<s-tabs :tabs="tabs" :value="value" @change="value = $event" />`,
  {
    data: () => ({
      value: 'used',
      tabs: [
        { value: 'used', label: 'Your colors' },
        { value: 'palette', label: 'Palette' },
        { value: 'custom', label: 'Custom', disabled: true },
      ],
    }),
  }
);
