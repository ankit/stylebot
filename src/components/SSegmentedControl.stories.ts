import type { Meta } from '@storybook/vue';

import SSegmentedControl from './SSegmentedControl.vue';
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@stylebot/icons';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SSegmentedControl',
  component: SSegmentedControl,
};

export default meta;

const textOptions = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strike' },
];

export const Default = fromTemplate(
  { SSegmentedControl },
  `
  <div style="width: 280px">
    <s-segmented-control :options="options" :value="value" @change="value = $event" />
  </div>
`,
  { data: () => ({ value: 'underline', options: textOptions }) }
);

export const Fit = fromTemplate(
  { SSegmentedControl },
  `<s-segmented-control fit :options="options" :value="value" @change="value = $event" />`,
  { data: () => ({ value: 'none', options: textOptions }) }
);

export const Disabled = fromTemplate(
  { SSegmentedControl },
  `
  <div style="width: 280px">
    <s-segmented-control disabled :options="options" :value="value" />
  </div>
`,
  { data: () => ({ value: 'none', options: textOptions }) }
);

export const IconOptions = fromTemplate(
  { SSegmentedControl, AlignLeftIcon, AlignCenterIcon, AlignRightIcon },
  `
  <div style="width: 200px">
    <s-segmented-control :options="options" :value="value" @change="value = $event">
      <template #option="{ option }">
        <component :is="option.icon" :size="14" />
      </template>
    </s-segmented-control>
  </div>
`,
  {
    data: () => ({
      value: 'center',
      options: [
        { value: 'left', title: 'Left', icon: 'align-left-icon' },
        { value: 'center', title: 'Center', icon: 'align-center-icon' },
        { value: 'right', title: 'Right', icon: 'align-right-icon' },
      ],
    }),
  }
);
