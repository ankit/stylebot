import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import TheMoreAction from './TheMoreAction.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import { openEditorMenu, storeOf } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Options menu',
  tags: ['test'],
  component: TheMoreAction,
  parameters: { padded: false },
};

export default meta;

export const OpeningStopsInspecting: StoryObj = {
  ...editor({ ...WITH_RULE, inspecting: true }),
  name: 'opening the Options menu stops inspecting, so a click on the page to close it doesn’t pick an element',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await expect(store.state.inspecting).toBe(true);
    await openEditorMenu(within(canvasElement), 'Options');
    await expect(store.state.inspecting).toBe(false);
  },
};

export const MenuContents: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the Options menu offers Position, Theme, Publish to Gallery, Keyboard shortcuts and Options',
  play: async ({ canvasElement }) => {
    const menu = within(await openEditorMenu(within(canvasElement), 'Options'));

    await expect(menu.getByText('Position')).toBeVisible();
    await expect(menu.getByText('Theme')).toBeVisible();

    const positions = [
      'Open in side panel',
      'Open in separate window',
      'Dock left in page',
      'Dock right in page',
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
      'Publish to Gallery',
      expect.stringMatching(/^Keyboard shortcuts/),
      'Options',
    ]);
    await expect(menu.queryByRole('checkbox')).toBeNull();
  },
};
