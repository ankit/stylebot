import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import ColorPicker from './ColorPicker.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import type { Canvas } from '@stylebot/storybook/story-helpers';
import {
  cardCollapse,
  cardHeader,
  declaration,
  findOpenMenu,
  pageStyle,
  pressKey,
  propertyCard,
  propertyControl,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Color picker',
  tags: ['test'],
  component: ColorPicker,
  parameters: { padded: false },
};

export default meta;

// The pick-an-element state: the panel is enabled but nothing is styled yet.
const noRule = { activeSelector: 'h1' };

// Both the Text and Background cards label their row "Color", so a picker
// goes by its card.
const picker = (canvas: Canvas, card: string) =>
  propertyControl(within(propertyCard(canvas, card)), 'Color');
const hexField = (canvas: Canvas, card: string) =>
  picker(canvas, card).querySelector('.color-hex') as HTMLInputElement;
const swatch = (canvas: Canvas, card: string) =>
  picker(canvas, card).querySelector('.color-swatch') as HTMLElement;
const popover = (root: HTMLElement) =>
  root.querySelector('.color-picker-popover') as HTMLElement | null;

const openPopover = async (root: HTMLElement, card: string) => {
  await user.click(swatch(within(root), card));
  return waitFor(() => {
    const el = popover(root);
    expect(el).toBeVisible();
    return el as HTMLElement;
  });
};

export const HexFieldApplies: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the hex fields apply text and background colors live',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    const color = hexField(canvas, 'Text');
    await expect(color).toHaveValue('#2a5fd6');
    await user.type(color, '#112233');
    await expect(declaration(store, 'h1', 'color')).toBe('#112233');
    await expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
      'rgb(17, 34, 51)'
    );

    // Background is collapsed for a rule without one; open it first.
    await user.click(cardHeader(canvas, 'Background'));
    await waitFor(() =>
      expect(cardCollapse(canvas, 'Background')).not.toHaveClass('collapsed')
    );
    await user.type(hexField(canvas, 'Background'), '#fafafa');
    await expect(declaration(store, 'h1', 'background-color')).toBe('#fafafa');
  },
};

export const PopoverTabsFollowRule: StoryObj = {
  ...editor(noRule),
  name: 'the popover falls back to page colors, then switches to already-used colors once a rule is set',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    let panel = await openPopover(canvasElement, 'Text');
    const firstTab = () => panel.querySelector('.tabs .tab') as HTMLElement;

    await step(
      'with no rule yet, the first tab shows page colors',
      async () => {
        await expect(firstTab()).toHaveTextContent('Page colors');
        await expect(firstTab()).toHaveClass('active');
        await expect(panel.querySelector('.first-tab .swatch')).toBeVisible();
      }
    );

    await step('the footer field applies a declaration', async () => {
      // Set in one go, as a paste would: typing it out would apply the
      // partial hexes along the way.
      const valueField = panel.querySelector(
        '.value-field'
      ) as HTMLInputElement;
      valueField.focus();
      await fireEvent.input(valueField, { target: { value: '#112233' } });
      valueField.blur();
      await expect(declaration(store, 'h1', 'color')).toBe('#112233');
    });

    await step('reopened, the first tab shows the used colors', async () => {
      await user.click(swatch(canvas, 'Text'));
      await waitFor(() => expect(popover(canvasElement)).toBeNull());
      panel = await openPopover(canvasElement, 'Text');

      await expect(firstTab()).toHaveTextContent('Your colors');
      await expect(
        panel.querySelector('.used-colors .swatch[style*="17, 34, 51"]')
      ).toBeVisible();
    });

    await step('the color it closed on is listed as recent', async () => {
      await expect(panel.querySelector('.recent-section')).toBeVisible();
      await expect(
        panel.querySelector('.recent-section .swatch[style*="17, 34, 51"]')
      ).toBeVisible();
    });
  },
};

export const PaletteSearchChevron: StoryObj = {
  ...editor(noRule),
  name: 'the palette search lists every palette again from the chevron, even after a dead-end query',
  play: async ({ canvasElement }) => {
    const panel = await openPopover(canvasElement, 'Text');

    await user.click(within(panel).getByRole('tab', { name: 'Palette' }));
    const search = await waitFor(() => {
      const el = panel.querySelector('.palette-search') as HTMLElement;
      expect(el).toBeInTheDocument();
      return el;
    });
    const input = search.querySelector(
      '.autocomplete-input'
    ) as HTMLTextAreaElement;
    const activeLabel = input.value;

    // Escape on an open list restores the active palette's name...
    await user.clear(input);
    await user.keyboard(activeLabel.slice(0, 3));
    await findOpenMenu(within(panel));
    await pressKey('Escape');
    await waitFor(() => expect(input).toHaveValue(activeLabel));

    // ...and a query that matches nothing closes the list, but the chevron
    // still lists every palette without touching the text.
    await user.clear(input);
    await user.keyboard('zzz');
    await waitFor(() => expect(within(panel).queryByRole('menu')).toBeNull());

    await user.click(search.querySelector('.autocomplete-chevron') as Element);
    await findOpenMenu(within(panel));
    await expect(input).toHaveValue('zzz');
    await expect(within(panel).getAllByRole('menuitem').length).toBeGreaterThan(
      1
    );
  },
};

export const EscapeClosesPopoverNotEditor: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Escape closes the popover without closing the editor',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await openPopover(canvasElement, 'Text');
    await expect(store.state.colorPickerVisible).toBe(true);

    await pressKey('Escape');

    await waitFor(() => expect(popover(canvasElement)).toBeNull());
    await expect(store.state.colorPickerVisible).toBe(false);
    await expect(
      canvasElement.querySelector('.stylebot-content')
    ).toBeInTheDocument();
  },
};

/* While a popover is open the rest of the body ignores the pointer, so a
   stray click can't edit another property behind it. */
export const OpenPopoverBlocksBody: StoryObj = {
  ...editor(WITH_RULE),
  name: 'an open popover blocks pointer events on the rest of the panel',
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector('.stylebot-body') as HTMLElement;

    await expect(body.style.pointerEvents).toBe('');

    await openPopover(canvasElement, 'Text');
    await waitFor(() => expect(body.style.pointerEvents).toBe('none'));

    await pressKey('Escape');
    await waitFor(() => expect(body.style.pointerEvents).toBe(''));
  },
};
