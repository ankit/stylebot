import type { Meta } from '@storybook/vue';
import { within } from '@storybook/test';

import SAutocomplete from './SAutocomplete.vue';
import MenuItem from './MenuItem.vue';
import {
  findOpenMenu,
  fromTemplate,
  matrix,
  playground,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SAutocomplete',
  component: SAutocomplete,
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    mono: { control: 'boolean' },
    chips: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    value: '#main > p',
    placeholder: 'Select an element',
    mono: true,
    chips: false,
    disabled: false,
  },
};

export default meta;

const components = { SAutocomplete, MenuItem };

const data = () => ({
  items: [
    { id: 1, value: 'h1' },
    { id: 2, value: '.article-body' },
    { id: 3, value: '#main > p' },
  ],
});

const item = `
  <template #item="{ item, select }">
    <menu-item @click="select">{{ item.value }}</menu-item>
  </template>`;

export const Playground = playground(
  components,
  `
  <s-autocomplete
    :value="value"
    :placeholder="placeholder"
    :mono="mono"
    :chips="chips"
    :disabled="disabled"
    :items="items"
    style="width: 260px"
  >
    ${item}
  </s-autocomplete>
`,
  data
);

export const Variants = matrix({
  components,
  data,
  rows: [
    { label: 'default', attrs: '' },
    { label: 'mono', attrs: 'mono' },
    { label: 'chips', attrs: 'mono chips' },
  ],
  columns: [
    {
      label: 'Empty',
      cell: attrs =>
        `<s-autocomplete ${attrs} value="" placeholder="Search" :items="items" style="width: 240px">${item}</s-autocomplete>`,
    },
    {
      label: 'Value',
      cell: attrs =>
        `<s-autocomplete ${attrs} value="#main > p" :items="items" style="width: 240px">${item}</s-autocomplete>`,
    },
    {
      label: 'Disabled',
      cell: attrs =>
        `<s-autocomplete ${attrs} value="h1" disabled :items="items" style="width: 240px">${item}</s-autocomplete>`,
    },
  ],
});

export const Open = fromTemplate(
  components,
  `
  <div style="padding-bottom: 160px">
    <s-autocomplete value="" mono placeholder="Select an element" :items="items" style="width: 260px">
      ${item}
    </s-autocomplete>
  </div>
`,
  {
    data,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await user.click(
        canvasElement.querySelector('.autocomplete-chevron') as HTMLElement
      );
      await findOpenMenu(canvas);
    },
  }
);
