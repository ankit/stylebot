import type { Meta, StoryObj } from '@storybook/vue';

import SNumberField from './SNumberField.vue';
import { fromTemplate, nextFrame } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SNumberField',
  component: SNumberField,
};

export default meta;

const components = { SNumberField };

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-stack">
    <s-number-field value="16" unit="px" style="width: 120px" />
    <s-number-field value="" unit="px" style="width: 120px" />
    <s-number-field value="1.5" style="width: 120px" />
    <s-number-field value="16" unit="px" :presets="presets" style="width: 120px" />
    <s-number-field value="16" unit="px" :presets="presets" disabled style="width: 120px" />
  </div>
`,
  { data: () => ({ presets: [12, 14, 16, 18, 24] }) }
);

export const PresetsOpen: StoryObj = fromTemplate(
  components,
  `
  <div style="padding-bottom: 200px">
    <s-number-field value="16" unit="px" :presets="presets" style="width: 120px" />
  </div>
`,
  {
    data: () => ({ presets: [12, 14, 16, 18, 24] }),
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('.number-chevron')?.click();
      await nextFrame();
    },
  }
);
