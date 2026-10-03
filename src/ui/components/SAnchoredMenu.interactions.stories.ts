import type Vue from 'vue';
import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import SAnchoredMenu from './SAnchoredMenu.vue';
import SMenu from './SMenu.vue';
import SMenuItem from './SMenuItem.vue';
import SButton from './SButton.vue';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/Anchored menu',
  tags: ['test'],
  component: SAnchoredMenu,
};

export default meta;

export const EscapeBacksOutFirst: StoryObj = {
  render: () => ({
    components: { SAnchoredMenu, SMenu, SMenuItem, SButton },
    data: () => ({ editing: false }),
    template: `
      <div class="sb-anchor-right" style="padding-bottom: 140px">
        <s-anchored-menu
          :keep-open-on-escape="editing"
          @escape="editing = false"
        >
          <template #trigger="{ toggle }">
            <s-button variant="ghost" @click="toggle">Open menu</s-button>
          </template>
          <s-menu dense>
            <s-menu-item @click="editing = true">Rename</s-menu-item>
            <input v-if="editing" aria-label="Name" />
          </s-menu>
        </s-anchored-menu>
      </div>
    `,
  }),
  name: 'with keep-open-on-escape, Escape is handed to the content and a second Escape closes the menu',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await user.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByRole('menuitem', { name: 'Rename' }));
    await within(menu).findByRole('textbox', { name: 'Name' });

    await step('the first Escape backs out of the edit', async () => {
      await user.keyboard('{Escape}');

      await expect(
        within(menu).queryByRole('textbox', { name: 'Name' })
      ).toBeNull();
      await expect(menu).toBeVisible();
    });

    await step('the next one closes the menu', async () => {
      await user.keyboard('{Escape}');

      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    });
  },
};

export const StaysInsideBoundary: StoryObj = {
  render: () => ({
    components: { SAnchoredMenu, SMenu, SMenuItem, SButton },
    methods: {
      bounds(): HTMLElement {
        return (this as unknown as Vue).$refs.box as HTMLElement;
      },
    },
    template: `
      <div ref="box" class="box" style="position: relative; width: 300px; height: 200px; border: 1px solid var(--panel-border)">
        <div style="position: absolute; right: 16px">
          <s-anchored-menu align="start" :boundary="bounds">
            <template #trigger="{ toggle }">
              <s-button variant="ghost" @click="toggle">Open menu</s-button>
            </template>
            <s-menu dense :min-width="220">
              <s-menu-item>A wide menu item</s-menu-item>
            </s-menu>
          </s-anchored-menu>
        </div>
      </div>
    `,
  }),
  name: 'a menu opening past its boundary is shifted back inside it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvasElement.querySelector('.box') as HTMLElement;

    await user.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menu = await findOpenMenu(canvas);

    await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
      box.getBoundingClientRect().right - 8
    );
  },
};
