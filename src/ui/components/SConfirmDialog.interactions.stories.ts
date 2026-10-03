import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import SConfirmDialog from './SConfirmDialog.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/Confirm dialog',
  tags: ['test'],
  component: SConfirmDialog,
};

export default meta;

export const Contained: StoryObj = {
  ...fromTemplate(
    { SConfirmDialog },
    `<div class="box" style="position: relative; width: 396px; height: 400px">
      <s-confirm-dialog
        contained
        title="Delete profile"
        message="This will permanently delete the Dark profile and its CSS."
        confirm-label="Delete"
      />
    </div>`
  ),
  name: 'a contained dialog covers only its positioned container',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvasElement.querySelector('.box') as HTMLElement;
    const backdrop = canvas.getByRole('alertdialog')
      .parentElement as HTMLElement;

    await expect(backdrop.getBoundingClientRect()).toMatchObject({
      width: box.clientWidth,
      height: box.clientHeight,
    });
  },
};
