import type { Meta } from '@storybook/vue';

import SToggleSwitch from './SToggleSwitch.vue';
import SShortcutKbd from './SShortcutKbd.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SToggleSwitch',
  component: SToggleSwitch,
  argTypes: {
    value: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'radio', options: ['sm', 'lg'] },
    trackEnd: { control: 'boolean' },
    label: { control: 'text' },
    shortcut: { control: 'text' },
  },
  args: {
    value: true,
    disabled: false,
    size: 'sm',
    trackEnd: false,
    label: 'Readability',
    shortcut: '',
  },
};

export default meta;

const components = { SToggleSwitch, SShortcutKbd };

export const Playground = playground(
  components,
  `
  <s-toggle-switch
    :value="value"
    :disabled="disabled"
    :size="size"
    :track-end="trackEnd"
  >
    {{ label }}
    <template v-if="shortcut" #trailing>
      <s-shortcut-kbd small :value="shortcut" />
    </template>
  </s-toggle-switch>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'sm', attrs: 'size="sm"' },
    { label: 'lg', attrs: 'size="lg"' },
    { label: 'sm, track end', attrs: 'size="sm" track-end' },
  ],
  columns: [
    {
      label: 'Off',
      cell: attrs =>
        `<s-toggle-switch ${attrs} :value="false">Off</s-toggle-switch>`,
    },
    {
      label: 'On',
      cell: attrs =>
        `<s-toggle-switch ${attrs} :value="true">On</s-toggle-switch>`,
    },
    {
      label: 'Disabled',
      cell: attrs =>
        `<s-toggle-switch ${attrs} :value="true" disabled>Disabled</s-toggle-switch>`,
    },
    {
      label: 'With trailing',
      cell: attrs => `
        <s-toggle-switch ${attrs} :value="true">
          Reader mode
          <template #trailing><s-shortcut-kbd small value="alt+shift+r" /></template>
        </s-toggle-switch>`,
    },
  ],
});
