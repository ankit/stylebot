import type { Meta } from '@storybook/vue';

import SSlider from './SSlider.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SSlider',
  component: SSlider,
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    disabled: { control: 'boolean' },
  },
  args: { value: 40, disabled: false },
};

export default meta;

export const Playground = playground(
  { SSlider },
  `<s-slider :value="value" :min="0" :max="100" :step="1" :disabled="disabled" style="width: 240px" />`
);

export const Variants = matrix({
  components: { SSlider },
  rows: [
    { label: '0–100', attrs: ':value="40" :min="0" :max="100" :step="1"' },
    { label: '0–1', attrs: ':value="0.5" :min="0" :max="1" :step="0.01"' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs => `<s-slider ${attrs} style="width: 200px" />`,
    },
    {
      label: 'Disabled',
      cell: attrs => `<s-slider ${attrs} disabled style="width: 200px" />`,
    },
  ],
});
