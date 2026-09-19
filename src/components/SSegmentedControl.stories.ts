import type { Meta } from '@storybook/vue';

import SSegmentedControl from './SSegmentedControl.vue';
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@stylebot/icons';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Navigation/SSegmentedControl',
  component: SSegmentedControl,
  argTypes: {
    value: { control: 'radio', options: ['none', 'underline', 'line-through'] },
    fit: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { value: 'underline', fit: false, disabled: false },
};

export default meta;

const components = {
  SSegmentedControl,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
};

const data = () => ({
  textOptions: [
    { value: 'none', label: 'None' },
    { value: 'underline', label: 'Underline' },
    { value: 'line-through', label: 'Strike' },
  ],
  iconOptions: [
    { value: 'left', title: 'Left', icon: 'align-left-icon' },
    { value: 'center', title: 'Center', icon: 'align-center-icon' },
    { value: 'right', title: 'Right', icon: 'align-right-icon' },
  ],
});

export const Playground = playground(
  components,
  `
  <div style="width: 280px">
    <s-segmented-control :options="textOptions" :value="value" :fit="fit" :disabled="disabled" />
  </div>
`,
  data
);

const iconSlot = `
  <template #option="{ option }">
    <component :is="option.icon" :size="14" />
  </template>`;

export const Variants = matrix({
  components,
  data,
  rows: [
    { label: 'text', attrs: ':options="textOptions" value="underline"' },
    { label: 'fit', attrs: ':options="textOptions" value="none" fit' },
    { label: 'icons', attrs: ':options="iconOptions" value="center"' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs =>
        `<div style="width: 240px"><s-segmented-control ${attrs}>${iconSlot}</s-segmented-control></div>`,
    },
    {
      label: 'Disabled',
      cell: attrs =>
        `<div style="width: 240px"><s-segmented-control ${attrs} disabled>${iconSlot}</s-segmented-control></div>`,
    },
  ],
});
