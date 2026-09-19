import type { Meta, StoryObj } from '@storybook/vue';

import SAutocomplete from './SAutocomplete.vue';
import MenuItem from './MenuItem.vue';
import { fromTemplate, nextFrame } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/SAutocomplete',
  component: SAutocomplete,
};

export default meta;

const components = { SAutocomplete, MenuItem };

const items = [
  { id: 1, value: 'h1' },
  { id: 2, value: '.article-body' },
  { id: 3, value: '#main > p' },
];

const field = (attrs: string): string => `
  <s-autocomplete ${attrs} :items="items" style="width: 260px">
    <template #item="{ item, select }">
      <menu-item @click="select">{{ item.value }}</menu-item>
    </template>
  </s-autocomplete>
`;

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-stack">
    ${field('value="" placeholder="Search colors"')}
    ${field('value="h1" mono')}
    ${field('value="#main > p" mono chips')}
    ${field('value="h1" disabled')}
  </div>
`,
  { data: () => ({ items }) }
);

export const Open: StoryObj = fromTemplate(
  components,
  `<div style="padding-bottom: 160px">${field(
    'value="" mono placeholder="Select an element"'
  )}</div>`,
  {
    data: () => ({ items }),
    play: async ({ canvasElement }) => {
      canvasElement
        .querySelector<HTMLElement>('.autocomplete-chevron')
        ?.click();
      await nextFrame();
    },
  }
);
