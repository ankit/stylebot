import type { Meta, StoryObj } from '@storybook/vue';

import SAnchoredMenu from './SAnchoredMenu.vue';
import SMenu from './SMenu.vue';
import SMenuItem from './SMenuItem.vue';
import SButton from './SButton.vue';
import { within } from '@storybook/test';

import {
  findOpenMenu,
  fromTemplate,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SAnchoredMenu',
  component: SAnchoredMenu,
};

export default meta;

const components = { SAnchoredMenu, SMenu, SMenuItem, SButton };

/* Panels hang off the trigger's right edge, so anchor it right of a box. */
const menu = (wrapperStyle: string): string => `
  <div class="sb-anchor-right" style="${wrapperStyle}">
    <s-anchored-menu>
      <template #trigger="{ toggle }">
        <s-button variant="ghost" @click="toggle">Open menu</s-button>
      </template>
      <template #default="{ close }">
        <s-menu dense>
          <s-menu-item @click="close">Dock left</s-menu-item>
          <s-menu-item @click="close">Dock right</s-menu-item>
          <s-menu-item @click="close">Adjust page layout</s-menu-item>
        </s-menu>
      </template>
    </s-anchored-menu>
  </div>
`;

const open = (template: string): StoryObj =>
  fromTemplate(components, template, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await user.click(canvas.getByRole('button', { name: 'Open menu' }));
      await findOpenMenu(canvas);
    },
  });

export const Closed = fromTemplate(components, menu(''));

export const Open = open(menu('padding-bottom: 140px'));

export const FlipUp = open(
  menu('align-items: flex-end; height: calc(100vh - 32px)')
);
