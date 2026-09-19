import type { Meta } from '@storybook/vue';

import SMenu from './SMenu.vue';
import MenuItem from './MenuItem.vue';
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

const components = { SMenu, MenuItem };

export const Playground = playground(
  components,
  `
  <s-menu :dense="dense" :min-width="minWidth" :max-height="maxHeight">
    <menu-item>Open site</menu-item>
    <menu-item selected>Copy CSS</menu-item>
    <menu-item danger>Delete</menu-item>
  </s-menu>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'default', attrs: '' },
    { label: 'dense', attrs: 'dense' },
  ],
  columns: [
    {
      label: 'Items',
      cell: attrs => `
        <s-menu ${attrs}>
          <menu-item>Open site</menu-item>
          <menu-item>Copy CSS</menu-item>
          <menu-item>Delete</menu-item>
        </s-menu>`,
    },
    {
      label: 'Selected + danger',
      cell: attrs => `
        <s-menu ${attrs}>
          <menu-item>System</menu-item>
          <menu-item selected>Light</menu-item>
          <menu-item danger>Delete</menu-item>
        </s-menu>`,
    },
  ],
});

export const Scrollable = fromTemplate(
  components,
  `
  <s-menu dense :max-height="140">
    <menu-item v-for="font in fonts" :key="font">{{ font }}</menu-item>
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
