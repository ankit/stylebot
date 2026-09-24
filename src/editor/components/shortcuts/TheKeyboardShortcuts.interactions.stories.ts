import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheKeyboardShortcuts from './TheKeyboardShortcuts.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  findOpenMenu,
  numberInput,
  pressKey,
  propertyCard,
  propertyControl,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Escape',
  tags: ['test'],
  component: TheKeyboardShortcuts,
  parameters: { padded: false },
};

export default meta;

export const StepsOutOneLevelAtATime: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Escape closes the suggestions, then leaves the field, then closes the editor',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const selectorField = canvasElement.querySelector(
      '.selector-autocomplete'
    ) as HTMLElement;
    const input = () =>
      selectorField.querySelector('.autocomplete-input') as HTMLElement;

    await user.click(
      selectorField.querySelector('.autocomplete-chips') as HTMLElement
    );
    await findOpenMenu(canvas);

    await step('the first Escape only closes the suggestions', async () => {
      await pressKey('Escape');
      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
      await expect(input()).toHaveFocus();
    });

    await step('the second leaves the field for its row', async () => {
      await pressKey('Escape');
      await waitFor(() =>
        expect(canvasElement.querySelector('.selector-row')).toHaveFocus()
      );
      await expect(store.state.visible).toBe(true);
    });

    await step('the third closes the editor', async () => {
      await pressKey('Escape');
      await waitFor(() => expect(store.state.visible).toBe(false));
    });
  },
};

export const LeavesFieldForItsCard: StoryObj = {
  ...editor(WITH_RULE),
  name: "Escape leaves a property field for its card's header, so shortcuts work again",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const size = numberInput(propertyControl(canvas, 'Size'));

    await user.click(size);
    await pressKey('c');
    await expect(store.state.options.mode).toBe('basic');

    await pressKey('Escape');
    await waitFor(() =>
      expect(
        propertyCard(canvas, 'Text').querySelector('.property-card-header')
      ).toHaveFocus()
    );
    await expect(store.state.visible).toBe(true);

    await pressKey('c');
    await waitFor(() => expect(store.state.options.mode).toBe('code'));
  },
};

export const LeavesCodeEditor: StoryObj = {
  ...editor({ ...WITH_RULE, options: { mode: 'code' } }),
  name: 'Escape in the code editor moves to the Code tab rather than closing the editor',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    // Stands in for Monaco, which reports an Escape none of its widgets took.
    window.postMessage({ type: 'stylebotEscapePressed' }, '*');

    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Code' })).toHaveFocus()
    );
    await expect(store.state.visible).toBe(true);

    await pressKey('Escape');
    await waitFor(() => expect(store.state.visible).toBe(false));
  },
};
