import type { Meta } from '@storybook/vue';

import SSlider from './SSlider.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SSlider',
  component: SSlider,
};

export default meta;

export const Default = fromTemplate(
  { SSlider },
  `
  <div class="sb-stack" style="width: 240px">
    <s-slider :value="40" :min="0" :max="100" :step="1" style="width: 100%" />
    <s-slider :value="0.5" :min="0" :max="1" :step="0.01" style="width: 100%" />
    <s-slider :value="70" :min="0" :max="100" :step="1" disabled style="width: 100%" />
  </div>
`
);
