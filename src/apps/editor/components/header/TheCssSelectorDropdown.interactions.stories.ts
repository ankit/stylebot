import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheCssSelectorDropdown from './TheCssSelectorDropdown.vue';
import {
  editor,
  RULE_CSS,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
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

    // Picking leaves the field, which shows the selector as chips again.
    await user.click(items(canvasElement)[0]);
    await expect(store.state.activeSelector).toBe('.article-body');
    await waitFor(() =>
      expect(chips(canvasElement)).toHaveTextContent('.article-body')
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

    // The active selector's row is checked, and Down moves on from it.
    await expect(items(canvasElement)[0]).toHaveClass('selected');
    await pressKey('ArrowDown');
    await waitFor(() => expect(items(canvasElement)[1]).toHaveFocus());

    await pressKey('ArrowUp');
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

const GROUP = ['h1', 'h2', '.title', '.subtitle', '.byline'];

export const SelectorListAsText: StoryObj = {
  ...editor({
    css: `${GROUP.join(', ')} { color: red; }\n\np { color: blue; }`,
    activeSelector: GROUP.join(', '),
  }),
  name: 'a selector list reads as one line of text with dimmed commas, in the field and in the list',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const expectInOrder = async (container: HTMLElement) => {
      const parts = [...container.querySelectorAll('.part')];
      await expect(parts.map(part => part.textContent)).toEqual(GROUP);
      await expect(container.querySelectorAll('.separator')).toHaveLength(
        GROUP.length - 1
      );
      await expect(container.querySelector('.chip')).toBeNull();
    };

    await expectInOrder(chips(canvasElement));

    await user.click(chips(canvasElement));
    await findOpenMenu(canvas);
    await waitFor(() => expect(items(canvasElement)).toHaveLength(2));
    await expectInOrder(items(canvasElement)[0] as HTMLElement);
    await expect(items(canvasElement)[1]).toHaveTextContent(/^\s*p\s*$/);
  },
};

const ALTERNATIVES_CSS = `${RULE_CSS}

* {
  box-sizing: border-box;
}`;

const WITH_ALTERNATIVES = {
  css: ALTERNATIVES_CSS,
  activeSelector: 'h1',
  selectorAlternatives: {
    existing: ['h1', '*'],
    candidates: ['h1', '.sb-page h1', 'div h1'],
  },
};

const headers = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('.section-header'), header =>
    header.textContent?.trim()
  );

const dividers = (root: HTMLElement) =>
  root.querySelectorAll('.section-divider');

const row = (root: HTMLElement, selector: string) =>
  Array.from(items(root)).find(
    item => item.querySelector('.item-text')?.textContent?.trim() === selector
  ) as HTMLElement;

const rowTexts = (root: HTMLElement) =>
  Array.from(items(root), item =>
    item.querySelector('.item-text')?.textContent?.trim()
  );

const linked = (item: HTMLElement) => item.querySelector('.item-icon') !== null;

export const SectionsForTheElementAndPage: StoryObj = {
  ...editor(WITH_ALTERNATIVES),
  name: "the list offers the picked element's selectors, then the page's other rules",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(chips(canvasElement));
    await findOpenMenu(canvas);

    await expect(headers(canvasElement)).toEqual([
      'This element',
      'Styled on this page',
    ]);
    await expect(dividers(canvasElement)).toHaveLength(1);
    const line = dividers(canvasElement)[0].getBoundingClientRect();
    await expect(line.height).toBeGreaterThan(0.5);
    await expect(line.width).toBeGreaterThan(200);
    await expect(rowTexts(canvasElement)).toEqual([
      'h1',
      '*',
      '.sb-page h1',
      'div h1',
      '.article-body',
    ]);

    // The active selector leads, checked rather than linked.
    const current = row(canvasElement, 'h1');
    await expect(current).toHaveClass('selected');
    await expect(current.querySelector('.menu-item-check')).not.toBeNull();
    await expect(linked(current)).toBe(false);

    // Selectors the style already has link to their rules.
    await expect(linked(row(canvasElement, '*'))).toBe(true);
    await expect(linked(row(canvasElement, '.sb-page h1'))).toBe(false);
    await expect(linked(row(canvasElement, '.article-body'))).toBe(true);
  },
};

export const PickAnAlternative: StoryObj = {
  ...editor(WITH_ALTERNATIVES),
  name: "picking one of the element's selectors makes it the active selector",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(chips(canvasElement));
    await findOpenMenu(canvas);
    await user.click(row(canvasElement, 'div h1'));
    await expect(store.state.activeSelector).toBe('div h1');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());

    // The element's selectors are still offered, the new one first.
    await user.click(chips(canvasElement));
    await findOpenMenu(canvas);
    await expect(rowTexts(canvasElement).slice(0, 2)).toEqual(['div h1', 'h1']);
    await expect(row(canvasElement, 'div h1')).toHaveClass('selected');
    await pressKey('Escape');

    // Choosing something unrelated leaves only the page's rules.
    store.commit('setActiveSelector', '.article-body');
    await user.click(
      field(canvasElement).querySelector('.autocomplete-chevron') as Element
    );
    await findOpenMenu(canvas);
    await expect(headers(canvasElement)).toEqual(['Styled on this page']);
    await expect(dividers(canvasElement)).toHaveLength(0);
  },
};

export const TypingFiltersBothSections: StoryObj = {
  ...editor(WITH_ALTERNATIVES),
  name: 'typing filters both sections and drops an emptied one with its divider',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(chips(canvasElement));
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await user.clear(input(canvasElement));
    await user.type(input(canvasElement), '.');

    await findOpenMenu(canvas);
    await waitFor(() =>
      expect(rowTexts(canvasElement)).toEqual(['.sb-page h1', '.article-body'])
    );
    await expect(headers(canvasElement)).toEqual([
      'This element',
      'Styled on this page',
    ]);
    await expect(dividers(canvasElement)).toHaveLength(1);

    await user.type(input(canvasElement), 'sb');
    await waitFor(() =>
      expect(rowTexts(canvasElement)).toEqual(['.sb-page h1'])
    );
    await expect(headers(canvasElement)).toEqual(['This element']);
    await expect(dividers(canvasElement)).toHaveLength(0);
  },
};

export const RepeatedRulesListedOnce: StoryObj = {
  ...editor({
    css: 'h1 { color: red; }\n\np { color: blue; }\n\np { margin: 0; }',
    activeSelector: 'h1',
  }),
  name: 'a selector with several rules is listed once',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(chips(canvasElement));
    await findOpenMenu(canvas);
    await waitFor(() => expect(rowTexts(canvasElement)).toContain('p'));
    await expect(rowTexts(canvasElement).filter(text => text === 'p')).toEqual([
      'p',
    ]);
  },
};

export const ClearButtonEmptiesSelector: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the clear button empties the selector and leaves the caret in the field',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const clear = () =>
      field(canvasElement).querySelector(
        '.autocomplete-clear'
      ) as HTMLButtonElement | null;

    await waitFor(() => expect(clear()).not.toBeNull());
    await user.click(clear() as HTMLButtonElement);

    await expect(store.state.activeSelector).toBe('');
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await expect(input(canvasElement)).toHaveValue('');
    await expect(clear()).toBeNull();
    await expect(within(canvasElement).queryByRole('menu')).toBeNull();
  },
};
