import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import FontFamily from './FontFamily.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  declaration,
  findOpenMenu,
  pressKey,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Interactions/Font picker',
  component: FontFamily,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

type Canvas = ReturnType<typeof within>;

const field = (root: HTMLElement) =>
  root.querySelector('.font-family-autocomplete') as HTMLElement;
const input = (root: HTMLElement) =>
  field(root).querySelector('.autocomplete-input') as HTMLTextAreaElement;
const chips = (root: HTMLElement) =>
  Array.from(field(root).querySelectorAll('.autocomplete-chips .chip'), chip =>
    chip.textContent?.trim()
  );

/* Focusing the field opens the menu; with a value set it renders as chips
   until clicked, and the revealed input starts fully selected. */
const openPicker = async (root: HTMLElement) => {
  const pill = field(root).querySelector('.autocomplete-chips') ?? input(root);
  await userEvent.click(pill);
  await waitFor(() => expect(input(root)).toHaveFocus());
  return input(root);
};

// A row's accessible name is its label plus, for Google Fonts, the category.
const menuItem = (canvas: Canvas, name: string) =>
  canvas.findByRole('menuitem', {
    name: new RegExp(
      `^${name}( (sans-serif|serif|display|handwriting|monospace))?$`
    ),
  });

export const EscapeClosesPickerNotEditor = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openPicker(canvasElement);
    await findOpenMenu(canvas);

    await pressKey('Escape');

    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(
      canvasElement.querySelector('.stylebot-content')
    ).toBeInTheDocument();
  },
});

export const SuggestsAndApplies = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await userEvent.keyboard('playf');

    const row = await menuItem(canvas, 'Playfair Display');
    await expect(row.querySelector('.font-row-category')).toHaveTextContent(
      'serif'
    );

    await pressKey('ArrowDown');
    await pressKey('Enter');

    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(declaration(store, 'h1', 'font-family')).toBe(
      'Playfair Display'
    );
    await expect(store.state.options.fonts[0]).toBe('Playfair Display');
    await waitFor(() =>
      expect(chips(canvasElement)).toEqual(['Playfair Display'])
    );

    // The chevron opens the picker like a click on the field: focused, value
    // kept (and selected), recents shown.
    await userEvent.click(
      field(canvasElement).querySelector('.autocomplete-chevron') as Element
    );
    await findOpenMenu(canvas);
    const text = input(canvasElement);
    await expect(text).toHaveFocus();
    await expect(text).toHaveValue('Playfair Display');
    await expect(text.selectionStart).toBe(0);
    await expect(text.selectionEnd).toBe(text.value.length);

    const items = canvas.getAllByRole('menuitem');
    await expect(items[0]).toHaveTextContent('Default');
    await expect(items[1]).toHaveTextContent('Playfair Display');
    await expect(items.at(-1)).toHaveTextContent('Browse Google Fonts');
  },
});

export const CategoryFilter = editor(withRule, {
  play: async ({ canvasElement }) => {
    await openPicker(canvasElement);
    await userEvent.keyboard('mono');

    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll('[role=menuitem] .font-row-category')
          .length
      ).toBeGreaterThan(3)
    );
    const categories = Array.from(
      canvasElement.querySelectorAll('[role=menuitem] .font-row-category'),
      el => el.textContent?.trim()
    );
    await expect(categories.every(text => text === 'monospace')).toBe(true);
  },
});

export const CustomValue = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await userEvent.keyboard('Nonexistent Font');
    await menuItem(canvas, 'Use "Nonexistent Font"');

    await pressKey('Enter');

    await expect(declaration(store, 'h1', 'font-family')).toBe(
      'Nonexistent Font'
    );
    await waitFor(() =>
      expect(chips(canvasElement)).toEqual(['Nonexistent Font'])
    );
  },
});

export const ArrowKeys = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const text = await openPicker(canvasElement);

    await userEvent.keyboard('playf');
    const playfair = await menuItem(canvas, 'Playfair Display');

    await pressKey('ArrowDown');
    await waitFor(() => expect(playfair).toHaveFocus());

    await pressKey('ArrowUp');
    await waitFor(() => expect(text).toHaveFocus());
    await findOpenMenu(canvas);
    await expect(text).toHaveValue('playf');

    // Editing continues from the end of the text, not from a re-selected
    // value.
    await userEvent.keyboard('a');
    await expect(text).toHaveValue('playfa');

    // Up from the field wraps to the last row, Down past it comes back.
    await pressKey('ArrowUp');
    await waitFor(() =>
      expect(
        canvas.getByRole('menuitem', { name: 'Browse Google Fonts' })
      ).toHaveFocus()
    );
    await pressKey('ArrowDown');
    await waitFor(() => expect(text).toHaveFocus());

    // Escape only closes the list; the text stays, and reopening with Down
    // keeps the caret rather than re-selecting the text.
    await pressKey('Escape');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(text).toHaveValue('playfa');
    await expect(text).toHaveFocus();
    await pressKey('ArrowDown');
    await findOpenMenu(canvas);
    await userEvent.keyboard('i');
    await expect(text).toHaveValue('playfai');

    // Leaving from a row applies the typed text just like leaving from the
    // field, and a half-typed name is applied but not remembered.
    await pressKey('ArrowDown');
    await pressKey('Tab');
    await waitFor(() => expect(chips(canvasElement)).toEqual(['playfai']));
    await expect(declaration(store, 'h1', 'font-family')).toBe('playfai');
    await expect(store.state.options.fonts).not.toContain('playfai');
  },
});

export const BrowseDiscardsDraft = editor(
  { css: 'h1 { color: red; }', activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const store = storeOf(canvasElement);

      await openPicker(canvasElement);
      await userEvent.keyboard('playf');

      await userEvent.click(await menuItem(canvas, 'Browse Google Fonts'));

      await waitFor(() => expect(input(canvasElement)).toHaveValue(''));
      await expect(chips(canvasElement)).toEqual([]);
      await expect(declaration(store, 'h1', 'font-family')).toBeUndefined();
    },
  }
);

export const StackEditing = editor(
  {
    css: 'h1 { font-family: "Playfair Display", Georgia, serif; }',
    activeSelector: 'h1',
  },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const store = storeOf(canvasElement);

      // Chips show family names without their CSS quotes.
      await expect(chips(canvasElement)).toEqual([
        'Playfair Display',
        'Georgia',
        'serif',
      ]);

      const text = await openPicker(canvasElement);
      await expect(text).toHaveValue('"Playfair Display", Georgia, serif');
      await userEvent.keyboard('Lora');
      await pressKey('Enter');
      await expect(declaration(store, 'h1', 'font-family')).toBe('Lora');
      await waitFor(() => expect(chips(canvasElement)).toEqual(['Lora']));

      await openPicker(canvasElement);
      // ArrowRight collapses the pre-selected value to its end.
      await pressKey('ArrowRight');
      await userEvent.keyboard(', Georgia, serif');
      await menuItem(canvas, 'Use "Lora, Georgia, serif"');
      await pressKey('Enter');
      await expect(declaration(store, 'h1', 'font-family')).toBe(
        'Lora, Georgia, serif'
      );

      await openPicker(canvasElement);
      await pressKey('ArrowRight');
      await userEvent.keyboard(', playf');
      await menuItem(canvas, 'Playfair Display');
      await pressKey('ArrowDown');
      await pressKey('Enter');
      await expect(declaration(store, 'h1', 'font-family')).toBe(
        'Lora, Georgia, serif, "Playfair Display"'
      );
    },
  }
);
