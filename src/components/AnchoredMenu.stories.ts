import type { Meta, StoryObj } from '@storybook/vue';

import AnchoredMenu from './AnchoredMenu.vue';
import SMenu from './SMenu.vue';
import MenuItem from './MenuItem.vue';
import SButton from './SButton.vue';
import { fromTemplate, nextFrame } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/AnchoredMenu',
  component: AnchoredMenu,
};

export default meta;

const components = { AnchoredMenu, SMenu, MenuItem, SButton };

/* Panels hang off the trigger's right edge, so anchor it right of a box. */
const menu = (wrapperStyle: string): string => `
  <div class="sb-anchor-right" style="${wrapperStyle}">
    <anchored-menu>
      <template #trigger="{ toggle }">
        <s-button variant="ghost" @click="toggle">Open menu</s-button>
      </template>
      <template #default="{ close }">
        <s-menu dense>
          <menu-item @click="close">Dock left</menu-item>
          <menu-item @click="close">Dock right</menu-item>
          <menu-item @click="close">Adjust page layout</menu-item>
        </s-menu>
      </template>
    </anchored-menu>
  </div>
`;

const open = (template: string): StoryObj =>
  fromTemplate(components, template, {
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('button')?.click();
      await nextFrame();
    },
  });

export const Closed = fromTemplate(components, menu(''));

export const Open = open(menu('padding-bottom: 140px'));

export const FlipUp = open(
  menu('align-items: flex-end; height: calc(100vh - 32px)')
);
