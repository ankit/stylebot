import type { Meta, StoryObj } from '@storybook/vue';

import SSelect from './SSelect.vue';
import MenuItem from './MenuItem.vue';
import { fromTemplate, nextFrame } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/SSelect',
  component: SSelect,
};

export default meta;

const components = { SSelect, MenuItem };

const select = (attrs: string): string => `
  <s-select text="Merriweather" ${attrs}>
    <template #default="{ close }">
      <menu-item v-for="font in fonts" :key="font" :selected="font === 'Merriweather'" @click="close">
        {{ font }}
      </menu-item>
    </template>
  </s-select>
`;

const data = () => ({
  fonts: ['Helvetica', 'Montserrat', 'Merriweather', 'Fira Code'],
});

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-stack">
    ${select('')}
    ${select('muted')}
    ${select('disabled')}
    <div style="width: 300px">${select('full-width')}</div>
  </div>
`,
  { data }
);

export const Open: StoryObj = fromTemplate(
  components,
  `<div class="sb-anchor-right" style="padding-bottom: 180px">${select(
    ''
  )}</div>`,
  {
    data,
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('button')?.click();
      await nextFrame();
    },
  }
);
