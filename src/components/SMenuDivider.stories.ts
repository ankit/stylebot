import type { Meta } from '@storybook/vue';

import SMenu from './SMenu.vue';
import SMenuItem from './SMenuItem.vue';
import SMenuDivider from './SMenuDivider.vue';
import { matrix } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SMenuDivider',
  component: SMenuDivider,
};

export default meta;

export const Variants = matrix({
  components: { SMenu, SMenuItem, SMenuDivider },
  rows: [
    { label: 'default', attrs: '' },
    { label: 'dense', attrs: 'dense' },
  ],
  columns: [
    {
      label: 'Between groups',
      cell: attrs => `
        <s-menu ${attrs}>
          <s-menu-item>Open site</s-menu-item>
          <s-menu-item>Copy CSS</s-menu-item>
          <s-menu-divider />
          <s-menu-item danger>Delete</s-menu-item>
        </s-menu>`,
    },
  ],
});
