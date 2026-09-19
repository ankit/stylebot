import type { Meta } from '@storybook/vue';

import SSelect from './SSelect.vue';
import MenuItem from './MenuItem.vue';
import {
  fromTemplate,
  matrix,
  nextFrame,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SSelect',
  component: SSelect,
  argTypes: {
    text: { control: 'text' },
    muted: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    text: 'Merriweather',
    muted: false,
    disabled: false,
    fullWidth: false,
  },
};

export default meta;

const components = { SSelect, MenuItem };

const FONTS = ['Helvetica', 'Montserrat', 'Merriweather', 'Fira Code'];
const data = () => ({ fonts: FONTS });

const items = `
  <template #default="{ close }">
    <menu-item v-for="font in fonts" :key="font" :selected="font === 'Merriweather'" @click="close">
      {{ font }}
    </menu-item>
  </template>`;

export const Playground = playground(
  components,
  `
  <div style="width: 300px">
    <s-select :text="text" :muted="muted" :disabled="disabled" :full-width="fullWidth">
      ${items}
    </s-select>
  </div>
`,
  data
);

export const Variants = matrix({
  components,
  data,
  rows: [
    { label: 'default', attrs: 'text="Merriweather"' },
    { label: 'muted', attrs: 'text="Default" muted' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs => `<s-select ${attrs}>${items}</s-select>`,
    },
    {
      label: 'Disabled',
      cell: attrs => `<s-select ${attrs} disabled>${items}</s-select>`,
    },
    {
      label: 'Full width',
      cell: attrs =>
        `<div style="display: flex; width: 220px"><s-select ${attrs} full-width>${items}</s-select></div>`,
    },
  ],
});

export const Open = fromTemplate(
  components,
  `
  <div class="sb-anchor-right" style="padding-bottom: 180px">
    <s-select text="Merriweather">${items}</s-select>
  </div>
`,
  {
    data,
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('button')?.click();
      await nextFrame();
    },
  }
);
