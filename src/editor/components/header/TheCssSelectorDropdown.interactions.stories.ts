import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheCssSelectorDropdown from './TheCssSelectorDropdown.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  findOpenMenu,
  pressKey,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Interactions/Selector field',
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

export const TypingCommitsSelector = editor(
  { css: RULE_CSS, activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const store = storeOf(canvasElement);

      await userEvent.click(chips(canvasElement));
      await waitFor(() => expect(input(canvasElement)).toHaveFocus());

      await userEvent.clear(input(canvasElement));
      await userEvent.type(input(canvasElement), 'art');
      await expect(store.state.activeSelector).toBe('art');

      // Suggestions are the style's other selectors matching the query.
      await findOpenMenu(canvas);
      await waitFor(() => expect(items(canvasElement)).toHaveLength(1));
      await expect(items(canvasElement)[0]).toHaveTextContent('.article-body');

      // Picking keeps the field focused for further edits, so the value
      // shows in the input rather than as chips.
      await userEvent.click(items(canvasElement)[0]);
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
  }
);

export const ArrowKeysBetweenFieldAndList = editor(
  { css: 'h1 { color: red; }\n\np { color: blue; }', activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);

      await expect(chips(canvasElement)).toHaveTextContent('h1');

      // The chips are a tab stop that hands focus to the input, which
      // opens the list.
      chips(canvasElement).focus();
      await waitFor(() => expect(input(canvasElement)).toHaveFocus());
      await findOpenMenu(canvas);
      await pressKey('Escape');
      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());

      // The chevron focuses the field, keeps its value and lists every
      // selector.
      await userEvent.click(
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
  }
);

export const DisabledOutsideBasicMode = editor(
  { css: RULE_CSS, activeSelector: 'h1' },
  {
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
  }
);
