import type { Meta } from '@storybook/vue';

import SMenu from './SMenu.vue';
import MenuItem from './MenuItem.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SMenu',
  component: SMenu,
};

export default meta;

const components = { SMenu, MenuItem };

export const Default = fromTemplate(
  components,
  `
  <s-menu>
    <menu-item>Open site</menu-item>
    <menu-item>Copy CSS</menu-item>
    <menu-item danger>Delete</menu-item>
  </s-menu>
`
);

export const Dense = fromTemplate(
  components,
  `
  <s-menu dense>
    <menu-item>System</menu-item>
    <menu-item selected>Light</menu-item>
    <menu-item>Dark</menu-item>
  </s-menu>
`
);

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
