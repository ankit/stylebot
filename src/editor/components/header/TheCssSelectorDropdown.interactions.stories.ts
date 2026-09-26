import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheCssSelectorDropdown from './TheCssSelectorDropdown.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  findOpenMenu,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Selector field',
  tags: ['test'],
  component: TheCssSelectorDropdown,
  parameters: { padded: false },
};

export default meta;

const field = (root: HTMLElement) =>
  root.querySelector('.selector-autocomplete') as HTMLElement;
const input = (root: HTMLElement) =>
  field(root).querySelector('.autocomplete-input') as HTMLTextAreaElement;
const chips = (root: HTMLElement) =>
  field(root).querySelector('.autocomplete-chips') as HTMLElement;
const items = (root: HTMLElement) =>
  root.querySelectorAll('.css-selector-dropdown-item');

export const TypingCommitsSelector: StoryObj = {
  ...editor(WITH_RULE),
  name: "typing a selector applies it and the list offers the style's other selectors",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(chips(canvasElement));
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());

    await user.clear(input(canvasElement));
    await user.type(input(canvasElement), 'art');
    await expect(store.state.activeSelector).toBe('art');

    // Suggestions are the style's other selectors matching the query.
    await findOpenMenu(canvas);
    await waitFor(() => expect(items(canvasElement)).toHaveLength(1));
    await expect(items(canvasElement)[0]).toHaveTextContent('.article-body');

    // Hovering a suggestion previews it on the page: the two paragraphs,
    // and nothing that isn't rendered.
    await user.hover(items(canvasElement)[0]);
    await waitFor(() =>
      expect(
        document.querySelectorAll('#stylebot-overlay .stylebot-overlay-hint')
      ).toHaveLength(2)
    );
    await expect(
      document.querySelectorAll('#stylebot-overlay .stylebot-overlay-rect')
    ).toHaveLength(0);

    // Picking keeps the field focused for further edits, so the value
    // shows in the input rather than as chips.
    await user.click(items(canvasElement)[0]);
    await expect(store.state.activeSelector).toBe('.article-body');
    await waitFor(() =>
      expect(input(canvasElement)).toHaveValue('.article-body')
    );
    await waitFor(() =>
      expect(
        field(canvasElement).querySelector('.active-style-count')
      ).toHaveTextContent('1')
    );
  },
};

export const ArrowKeysBetweenFieldAndList: StoryObj = {
  ...editor({
    css: 'h1 { color: red; }\n\np { color: blue; }',
    activeSelector: 'h1',
  }),
  name: 'arrow keys return from the selector suggestions to the selector field',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(chips(canvasElement)).toHaveTextContent('h1');

    // The chips are a tab stop that leaves the list closed; Enter hands
    // focus to the input and opens it.
    chips(canvasElement).focus();
    await expect(chips(canvasElement)).toHaveFocus();
    await expect(canvas.queryByRole('menu')).toBeNull();
    await pressKey('Enter');
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await findOpenMenu(canvas);
    await pressKey('Escape');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());

    // The chevron focuses the field, keeps its value and lists every
    // selector.
    await user.click(
      field(canvasElement).querySelector('.autocomplete-chevron') as Element
    );
    await findOpenMenu(canvas);
    await expect(input(canvasElement)).toHaveFocus();
    await expect(input(canvasElement)).toHaveValue('h1');
    await expect(items(canvasElement)).toHaveLength(2);

    await pressKey('ArrowDown');
    await waitFor(() => expect(items(canvasElement)[0]).toHaveFocus());

    await pressKey('ArrowUp');
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await expect(canvas.getByRole('menu')).toBeVisible();

    // Escape closes the list and leaves the selector as it was.
    await pressKey('Escape');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(input(canvasElement)).toHaveValue('h1');
    await expect(
      canvasElement.querySelector('.stylebot-content')
    ).toBeInTheDocument();
  },
};

export const DisabledOutsideBasicMode: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the selector field is disabled outside Basic mode',
  play: async ({ canvasElement }) => {
    await pressKey('c');
    await waitFor(() =>
      expect(
        field(canvasElement).querySelector('.autocomplete-pill')
      ).toHaveClass('disabled')
    );

    await pressKey('b');
    await waitFor(() =>
      expect(
        field(canvasElement).querySelector('.autocomplete-pill')
      ).not.toHaveClass('disabled')
    );
  },
};
