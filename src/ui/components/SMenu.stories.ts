import type { Meta } from '@storybook/vue';

import SMenu from './SMenu.vue';
import SMenuItem from './SMenuItem.vue';
import {
  fromTemplate,
  matrix,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SMenu',
  component: SMenu,
  argTypes: {
    dense: { control: 'boolean' },
    minWidth: { control: { type: 'number', min: 100, max: 400 } },
    maxHeight: { control: { type: 'number', min: 0, max: 400 } },
  },
  args: { dense: false, minWidth: 176, maxHeight: 0 },
};

export default meta;

const components = { SMenu, SMenuItem };

export const Playground = playground(
  components,
  `
  <s-menu :dense="dense" :min-width="minWidth" :max-height="maxHeight">
    <s-menu-item>Open site</s-menu-item>
    <s-menu-item selected>Copy CSS</s-menu-item>
    <s-menu-item danger>Delete</s-menu-item>
  </s-menu>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'default', attrs: '' },
    { label: 'dense', attrs: 'dense' },
    { label: 'dense small', attrs: 'dense size="small"' },
  ],
  columns: [
    {
      label: 'Items',
      cell: attrs => `
        <s-menu ${attrs}>
          <s-menu-item>Open site</s-menu-item>
          <s-menu-item>Copy CSS</s-menu-item>
          <s-menu-item>Delete</s-menu-item>
        </s-menu>`,
    },
    {
      label: 'Selected + danger',
      cell: attrs => `
        <s-menu ${attrs}>
          <s-menu-item>System</s-menu-item>
          <s-menu-item selected>Light</s-menu-item>
          <s-menu-item danger>Delete</s-menu-item>
        </s-menu>`,
    },
  ],
});

export const Scrollable = fromTemplate(
  components,
  `
  <s-menu dense :max-height="140">
    <s-menu-item v-for="font in fonts" :key="font">{{ font }}</s-menu-item>
  </s-menu>
`,
  {
    data: () => ({
      fonts: [
        'Helvetica',
        'Montserrat',
        'Droid Sans',
        'Droid Serif',
        'Merriweather',
        'Playfair Display',
        'Fira Code',
        'Inconsolata',
      ],
    }),
  }
);
