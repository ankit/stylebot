import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import TheMoreAction from './TheMoreAction.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import { openEditorMenu } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Options menu',
  tags: ['test'],
  component: TheMoreAction,
  parameters: { padded: false },
};

export default meta;

export const MenuContents: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the Options menu offers Position, Theme, Keyboard shortcuts and Options',
  play: async ({ canvasElement }) => {
    const menu = within(await openEditorMenu(within(canvasElement), 'Options'));

    await expect(menu.getByText('Position')).toBeVisible();
    await expect(menu.getByText('Theme')).toBeVisible();

    const positions = [
      'Dock to Left',
      'Dock to Right',
      'Open in separate window',
    ];
    const buttons = positions.map(name => menu.getByRole('button', { name }));
    await expect(
      buttons.every(
        (button, index) =>
          index === 0 ||
          buttons[index - 1].compareDocumentPosition(button) &
            Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);

    const items = menu.getAllByRole('menuitem');
    await expect(items.map(item => item.textContent?.trim())).toEqual([
      expect.stringMatching(/^Keyboard shortcuts/),
      'Options',
    ]);
    await expect(menu.queryByRole('checkbox')).toBeNull();
  },
};
