import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import FontFamily from './FontFamily.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import type { Canvas } from '@stylebot/storybook/story-helpers';
import {
  declaration,
  findOpenMenu,
  focusViaTab,
  pageStyle,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Font picker',
  tags: ['test'],
  component: FontFamily,
  parameters: { padded: false },
};

export default meta;

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
  await user.click(pill);
  await waitFor(() => expect(input(root)).toHaveFocus());
  return input(root);
};

const chipsControl = (root: HTMLElement) =>
  field(root).querySelector('.autocomplete-chips') as HTMLElement | null;

// A row's accessible name is its label plus, for Google Fonts, the category.
const menuItem = (canvas: Canvas, name: string) =>
  canvas.findByRole('menuitem', {
    name: new RegExp(
      `^${name}( (sans-serif|serif|display|handwriting|monospace))?$`
    ),
  });

export const EscapeClosesPickerNotEditor: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Escape closes the picker without closing the editor',
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
};

export const SuggestsAndApplies: StoryObj = {
  ...editor(WITH_RULE),
  name: 'typing suggests Google Fonts; picking one applies it and lists it first next time',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await user.keyboard('playf');

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
    await expect(pageStyle(canvasElement, 'h1', 'font-family')).toMatch(
      /Playfair Display/
    );
    await expect(store.state.options.fonts[0]).toBe('Playfair Display');
    await waitFor(() =>
      expect(chips(canvasElement)).toEqual(['Playfair Display'])
    );

    // The chevron opens the picker like a click on the field: focused, value
    // kept (and selected), recents shown.
    await user.click(
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
};

export const CategoryFilter: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a category name lists that category',
  play: async ({ canvasElement }) => {
    await openPicker(canvasElement);
    await user.keyboard('mono');

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
};

export const CustomValue: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a font outside Google Fonts is applied as typed',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await user.keyboard('Nonexistent Font');
    await menuItem(canvas, 'Use "Nonexistent Font"');

    await pressKey('Enter');

    await expect(declaration(store, 'h1', 'font-family')).toBe(
      'Nonexistent Font'
    );
    await waitFor(() =>
      expect(chips(canvasElement)).toEqual(['Nonexistent Font'])
    );
  },
};

export const ArrowKeys: StoryObj = {
  ...editor(WITH_RULE),
  name: 'arrow keys move between the field and the suggestions',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const text = await openPicker(canvasElement);

    await user.keyboard('playf');
    const playfair = await menuItem(canvas, 'Playfair Display');

    await step('Down focuses a row, Up returns to the field', async () => {
      await pressKey('ArrowDown');
      await waitFor(() => expect(playfair).toHaveFocus());

      await pressKey('ArrowUp');
      await waitFor(() => expect(text).toHaveFocus());
      await findOpenMenu(canvas);
      await expect(text).toHaveValue('playf');
    });

    await step('editing continues from the end of the text', async () => {
      await user.keyboard('a');
      await expect(text).toHaveValue('playfa');
    });

    await step('Up from the field wraps to the last row', async () => {
      await pressKey('ArrowUp');
      await waitFor(() =>
        expect(
          canvas.getByRole('menuitem', { name: 'Browse Google Fonts' })
        ).toHaveFocus()
      );
      await pressKey('ArrowDown');
      await waitFor(() => expect(text).toHaveFocus());
    });

    await step('Escape closes the list and reverts the text', async () => {
      await pressKey('Escape');
      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
      await expect(text).toHaveValue('Merriweather');
      await expect(text).toHaveFocus();
    });

    await step('Down reopens it without re-selecting the text', async () => {
      await pressKey('ArrowDown');
      await findOpenMenu(canvas);
      await expect(text.selectionStart).toBe(text.value.length);
      await user.clear(text);
      await user.keyboard('playfai');
      await expect(text).toHaveValue('playfai');
    });

    await step(
      'Tab from a row applies the typed text, unremembered',
      async () => {
        await pressKey('ArrowDown');
        await pressKey('Tab');
        await waitFor(() => expect(chips(canvasElement)).toEqual(['playfai']));
        await expect(declaration(store, 'h1', 'font-family')).toBe('playfai');
        await expect(store.state.options.fonts).not.toContain('playfai');
      }
    );
  },
};

export const EscapeRevertsDraft: StoryObj = {
  ...editor({ css: 'h1 { font-family: Georgia; }', activeSelector: 'h1' }),
  name: 'Escape reverts typed text to the applied font',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const text = await openPicker(canvasElement);

    await step('Escape from a suggestion restores the text', async () => {
      await user.keyboard('playf');
      await menuItem(canvas, 'Playfair Display');
      await pressKey('ArrowDown');
      await pressKey('Escape');
      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
      await expect(text).toHaveFocus();
      await expect(text).toHaveValue('Georgia');
    });

    await step('Down reopens it with the caret at the end', async () => {
      await pressKey('ArrowDown');
      await findOpenMenu(canvas);
      await expect(text.selectionStart).toBe(text.value.length);
      await expect(text.selectionEnd).toBe(text.value.length);
      await pressKey('Escape');
    });

    await step('leaving afterwards applies nothing', async () => {
      await user.click(document.body);
      await waitFor(() => expect(chips(canvasElement)).toEqual(['Georgia']));
      await expect(declaration(store, 'h1', 'font-family')).toBe('Georgia');
    });
  },
};

export const ClickAwayApplies: StoryObj = {
  ...editor({ css: 'h1 { font-family: Georgia; }', activeSelector: 'h1' }),
  name: 'clicking away applies typed text rather than reverting it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await user.keyboard('Lora');
    await findOpenMenu(canvas);

    await user.click(document.body);

    await waitFor(() =>
      expect(declaration(store, 'h1', 'font-family')).toBe('Lora')
    );
    await expect(canvas.queryByRole('menu')).toBeNull();
  },
};

export const KeyboardPickKeepsFocus: StoryObj = {
  ...editor(WITH_RULE),
  name: 'after a keyboard pick, focus stays on the field and Tab moves on',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter on a suggestion focuses its chips, ringed', async () => {
      await openPicker(canvasElement);
      await user.keyboard('playf');
      await menuItem(canvas, 'Playfair Display');
      await pressKey('ArrowDown');
      await pressKey('Enter');

      await waitFor(() => expect(chipsControl(canvasElement)).toHaveFocus());
      await expect(chips(canvasElement)).toEqual(['Playfair Display']);
      await expect(chipsControl(canvasElement)).not.toHaveClass('quiet');
      await expect(canvas.queryByRole('menu')).toBeNull();
    });

    await step('Tab carries on past the field', async () => {
      await user.tab();
      await expect(field(canvasElement)).not.toContainElement(
        document.activeElement as HTMLElement
      );
      await expect(document.activeElement).not.toBe(document.body);
      await expect(canvas.queryByRole('menu')).toBeNull();
    });
  },
};

export const PointerPickKeepsFocusQuietly: StoryObj = {
  ...editor(WITH_RULE),
  name: 'after a click pick, focus stays on the field without a ring',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openPicker(canvasElement);
    await user.keyboard('playf');
    await user.click(await menuItem(canvas, 'Playfair Display'));

    await waitFor(() => expect(chipsControl(canvasElement)).toHaveFocus());
    await expect(chipsControl(canvasElement)).toHaveClass('quiet');
  },
};

/* Picks the first suggestion for `query` with the keyboard, leaving focus
   on the chips it commits to. */
const pickWithKeyboard = async (root: HTMLElement, query: string) => {
  await openPicker(root);
  await user.keyboard(query);
  await findOpenMenu(within(root));
  await pressKey('ArrowDown');
  await pressKey('Enter');
  await waitFor(() => expect(chipsControl(root)).toHaveFocus());
};

export const TabOntoChipsStaysClosed: StoryObj = {
  ...editor(WITH_RULE),
  name: 'tabbing onto the chips focuses them without opening the list',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = chipsControl(canvasElement) as HTMLElement;

    focusViaTab(canvasElement, '.font-family-autocomplete .autocomplete-chips');

    await expect(control).toHaveFocus();
    await expect(control).not.toHaveClass('quiet');
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(chips(canvasElement)).toEqual(['Merriweather']);
  },
};

export const TabOntoEmptyFieldStaysClosed: StoryObj = {
  ...editor({ css: 'h1 { color: red; }', activeSelector: 'h1' }),
  name: 'tabbing onto an empty field focuses it without opening the list',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = input(canvasElement);

    focusViaTab(canvasElement, '.font-family-autocomplete .autocomplete-input');
    await expect(text).toHaveFocus();
    await new Promise(resolve => setTimeout(resolve, 100));
    await expect(canvas.queryByRole('menu')).toBeNull();

    await pressKey('ArrowDown');
    await findOpenMenu(canvas);
    await pressKey('Escape');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());

    await user.keyboard('lor');
    await findOpenMenu(canvas);
    await menuItem(canvas, 'Lora');
  },
};

export const EnterOnChipsEdits: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Enter on the chips after a pick starts editing, value selected',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await pickWithKeyboard(canvasElement, 'playf');

    await pressKey('Enter');

    await findOpenMenu(canvas);
    const text = input(canvasElement);
    await expect(text).toHaveFocus();
    await expect(text).toHaveValue('Playfair Display');
    await expect(text.selectionStart).toBe(0);
    await expect(text.selectionEnd).toBe(text.value.length);
  },
};

export const TypingOnChipsEdits: StoryObj = {
  ...editor(WITH_RULE),
  name: 'typing on the chips after a pick starts over from the typed text',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    await pickWithKeyboard(canvasElement, 'playf');

    await user.keyboard('lo');

    const text = input(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await expect(text).toHaveValue('lo');
    await expect(text.selectionStart).toBe(2);
    await findOpenMenu(canvas);
    await menuItem(canvas, 'Lora');
    await expect(declaration(store, 'h1', 'font-family')).toBe(
      'Playfair Display'
    );
  },
};

export const DefaultPickKeepsFocus: StoryObj = {
  ...editor({ css: 'h1 { font-family: Georgia; }', activeSelector: 'h1' }),
  name: 'picking Default keeps focus on the empty field, menu closed',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await pressKey('Backspace');
    await menuItem(canvas, 'Default');
    await pressKey('ArrowDown');
    await pressKey('Enter');

    await waitFor(() =>
      expect(declaration(store, 'h1', 'font-family')).toBeUndefined()
    );
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await expect(canvas.queryByRole('menu')).toBeNull();
  },
};

export const BrowseDiscardsDraft: StoryObj = {
  ...editor({ css: 'h1 { color: red; }', activeSelector: 'h1' }),
  name: 'browsing Google Fonts discards typed text instead of showing it unapplied',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await openPicker(canvasElement);
    await user.keyboard('playf');

    await user.click(await menuItem(canvas, 'Browse Google Fonts'));

    await waitFor(() => expect(input(canvasElement)).toHaveValue(''));
    await expect(chips(canvasElement)).toEqual([]);
    await expect(declaration(store, 'h1', 'font-family')).toBeUndefined();
  },
};

export const StackEditing: StoryObj = {
  ...editor({
    css: 'h1 { font-family: "Playfair Display", Georgia, serif; }',
    activeSelector: 'h1',
  }),
  name: 'a stack written in code mode can be replaced or extended',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('chips show the families without their CSS quotes', async () => {
      await expect(chips(canvasElement)).toEqual([
        'Playfair Display',
        'Georgia',
        'serif',
      ]);
    });

    await step('typing over the raw value replaces the stack', async () => {
      const text = await openPicker(canvasElement);
      await expect(text).toHaveValue('"Playfair Display", Georgia, serif');
      await user.keyboard('Lora');
      await pressKey('Enter');
      await expect(declaration(store, 'h1', 'font-family')).toBe('Lora');
      await waitFor(() => expect(chips(canvasElement)).toEqual(['Lora']));
    });

    await step(
      'appending offers the typed stack as a custom value',
      async () => {
        await openPicker(canvasElement);
        // ArrowRight collapses the pre-selected value to its end.
        await pressKey('ArrowRight');
        await user.keyboard(', Georgia, serif');
        await menuItem(canvas, 'Use "Lora, Georgia, serif"');
        await pressKey('Enter');
        await expect(declaration(store, 'h1', 'font-family')).toBe(
          'Lora, Georgia, serif'
        );
      }
    );

    await step('a suggestion appended to a stack is quoted', async () => {
      await openPicker(canvasElement);
      await pressKey('ArrowRight');
      await user.keyboard(', playf');
      await menuItem(canvas, 'Playfair Display');
      await pressKey('ArrowDown');
      await pressKey('Enter');
      await expect(declaration(store, 'h1', 'font-family')).toBe(
        'Lora, Georgia, serif, "Playfair Display"'
      );
    });
  },
};
