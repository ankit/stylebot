import type { Meta } from '@storybook/vue';

import SNumberField from './SNumberField.vue';
import {
  fromTemplate,
  matrix,
  nextFrame,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SNumberField',
  component: SNumberField,
  argTypes: {
    value: { control: 'text' },
    unit: { control: 'text' },
    disabled: { control: 'boolean' },
    withPresets: { control: 'boolean' },
  },
  args: { value: '16', unit: 'px', disabled: false, withPresets: true },
};

export default meta;

const components = { SNumberField };
const data = () => ({ presets: [12, 14, 16, 18, 24] });

export const Playground = playground(
  components,
  `
  <s-number-field
    :value="value"
    :unit="unit"
    :disabled="disabled"
    :presets="withPresets ? presets : []"
    style="width: 120px"
  />
`,
  data
);

export const Variants = matrix({
  components,
  data,
  rows: [
    { label: 'unit', attrs: 'unit="px"' },
    { label: 'no unit', attrs: '' },
    { label: 'presets', attrs: 'unit="px" :presets="presets"' },
  ],
  columns: [
    {
      label: 'Value',
      cell: attrs =>
        `<s-number-field ${attrs} value="16" style="width: 120px" />`,
    },
    {
      label: 'Empty',
      cell: attrs =>
        `<s-number-field ${attrs} value="" style="width: 120px" />`,
    },
    {
      label: 'Disabled',
      cell: attrs =>
        `<s-number-field ${attrs} value="16" disabled style="width: 120px" />`,
    },
  ],
});

export const PresetsOpen = fromTemplate(
  components,
  `
  <div style="padding-bottom: 200px">
    <s-number-field value="16" unit="px" :presets="presets" style="width: 120px" />
  </div>
`,
  {
    data,
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('.number-chevron')?.click();
      await nextFrame();
    },
  }
);
