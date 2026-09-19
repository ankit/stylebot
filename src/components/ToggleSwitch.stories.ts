import type { Meta } from '@storybook/vue';

import ToggleSwitch from './ToggleSwitch.vue';
import ShortcutKbd from './ShortcutKbd.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/ToggleSwitch',
  component: ToggleSwitch,
  argTypes: {
    value: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'radio', options: ['sm', 'lg'] },
    label: { control: 'text' },
    shortcut: { control: 'text' },
  },
  args: {
    value: true,
    disabled: false,
    size: 'sm',
    label: 'Readability',
    shortcut: '',
  },
};

export default meta;

const components = { ToggleSwitch, ShortcutKbd };

export const Playground = playground(
  components,
  `
  <toggle-switch :value="value" :disabled="disabled" :size="size">
    {{ label }}
    <template v-if="shortcut" #trailing>
      <shortcut-kbd small :value="shortcut" />
    </template>
  </toggle-switch>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'sm', attrs: 'size="sm"' },
    { label: 'lg', attrs: 'size="lg"' },
  ],
  columns: [
    {
      label: 'Off',
      cell: attrs =>
        `<toggle-switch ${attrs} :value="false">Off</toggle-switch>`,
    },
    {
      label: 'On',
      cell: attrs => `<toggle-switch ${attrs} :value="true">On</toggle-switch>`,
    },
    {
      label: 'Disabled',
      cell: attrs =>
        `<toggle-switch ${attrs} :value="true" disabled>Disabled</toggle-switch>`,
    },
    {
      label: 'With trailing',
      cell: attrs => `
        <toggle-switch ${attrs} :value="true">
          Reader mode
          <template #trailing><shortcut-kbd small value="alt+shift+r" /></template>
        </toggle-switch>`,
    },
  ],
});
