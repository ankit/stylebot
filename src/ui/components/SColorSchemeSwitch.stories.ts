import type { Meta } from '@storybook/vue';

import SColorSchemeSwitch from './SColorSchemeSwitch.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Navigation/SColorSchemeSwitch',
  component: SColorSchemeSwitch,
  argTypes: {
    value: { control: 'radio', options: ['system', 'light', 'dark'] },
  },
  args: { value: 'system' },
};

export default meta;

const components = { SColorSchemeSwitch };

export const Playground = playground(
  components,
  '<s-color-scheme-switch :value="value" />'
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'system', attrs: 'value="system"' },
    { label: 'light', attrs: 'value="light"' },
    { label: 'dark', attrs: 'value="dark"' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs => `<s-color-scheme-switch ${attrs} />`,
    },
  ],
});
