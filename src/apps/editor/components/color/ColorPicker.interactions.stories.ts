import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import ColorPicker from './ColorPicker.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
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
  setRange,
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
const popoverHex = (panel: HTMLElement) =>
  panel.querySelector('.hex-input') as HTMLInputElement;

const openPopover = async (root: HTMLElement, card: string) => {
  await user.click(swatch(within(root), card));
  return waitFor(() => {
    const el = popover(root);
    expect(el).toBeVisible();
    return el as HTMLElement;
  });
};

const reopenPopover = async (root: HTMLElement, card: string) => {
  await user.click(swatch(within(root), card));
  await waitFor(() => expect(popover(root)).toBeNull());
  return openPopover(root, card);
};

// Set in one go, as a paste would: typing it out would apply the partial
// hexes along the way.
const pasteHex = async (panel: HTMLElement, value: string) => {
  const input = popoverHex(panel);
  input.focus();
  await fireEvent.input(input, { target: { value } });
  input.blur();
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

export const PopoverListsColors: StoryObj = {
  ...editor(noRule),
  name: 'the popover lists page colors, then the color a rule sets and the one it closed on',
  play: async ({ canvasElement, step }) => {
    const store = storeOf(canvasElement);

    let panel = await openPopover(canvasElement, 'Text');
    const pageColors = () => panel.querySelector('.page-colors') as HTMLElement;

    await step('with no rule yet, it shows the page colors', async () => {
      await expect(popoverHex(panel)).toHaveAttribute('placeholder', 'Not set');
      await waitFor(() =>
        expect(pageColors().querySelector('.swatch')).toBeVisible()
      );
      await expect(panel.querySelector('.recent-colors')).toBeNull();
    });

    await step('its hex field applies a declaration', async () => {
      await pasteHex(panel, '#112233');
      await expect(declaration(store, 'h1', 'color')).toBe('#112233');
    });

    await step("reopened, the rule's color leads the page colors", async () => {
      panel = await reopenPopover(canvasElement, 'Text');

      const first = pageColors().querySelector('.swatch') as HTMLElement;
      await expect(first).toHaveAttribute('title', '#112233');
      await expect(first).toHaveClass('selected');
    });

    await step('the color it closed on is listed as recent', async () => {
      await waitFor(() =>
        expect(
          panel.querySelector('.recent-colors .swatch[style*="17, 34, 51"]')
        ).toBeVisible()
      );
    });
  },
};

export const SwatchApplies: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a palette swatch applies its color and shows a check',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const panel = await openPopover(canvasElement, 'Text');

    const paletteSwatch = panel.querySelector(
      '.palette .swatch[title="#7d7669"]'
    ) as HTMLElement;
    await user.click(paletteSwatch);

    await expect(declaration(store, 'h1', 'color')).toBe('#7d7669');
    await waitFor(() => expect(paletteSwatch).toHaveClass('selected'));
    await expect(popoverHex(panel)).toHaveValue('#7d7669');
  },
};

export const SwatchHoverPreviews: StoryObj = {
  ...editor(WITH_RULE),
  name: 'hovering a swatch previews its color on the page without applying it',
  play: async ({ canvasElement, step }) => {
    const store = storeOf(canvasElement);
    const panel = await openPopover(canvasElement, 'Text');
    const paletteSwatch = panel.querySelector(
      '.palette .swatch[title="#7d7669"]'
    ) as HTMLElement;

    await step('hovering shows the color on the page', async () => {
      await user.hover(paletteSwatch);
      await waitFor(() =>
        expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
          'rgb(125, 118, 105)'
        )
      );
      await expect(declaration(store, 'h1', 'color')).toBe('#2a5fd6');
    });

    await step('leaving the swatches restores the color', async () => {
      // user-event fires mouseleave only on the swatch, not its grid as a browser would.
      await user.hover(popoverHex(panel));
      await fireEvent.mouseLeave(paletteSwatch.parentElement as HTMLElement);
      await waitFor(() =>
        expect(pageStyle(canvasElement, 'h1', 'color')).toBe('rgb(42, 95, 214)')
      );
    });

    await step('closing the popover mid-hover drops the preview', async () => {
      await user.hover(paletteSwatch);
      await waitFor(() =>
        expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
          'rgb(125, 118, 105)'
        )
      );
      await pressKey('Escape');
      await waitFor(() => expect(popover(canvasElement)).toBeNull());
      await expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
        'rgb(42, 95, 214)'
      );
    });
  },
};

export const PaletteMenu: StoryObj = {
  ...editor(noRule),
  name: 'the palette name opens the list of palettes, and the choice is remembered',
  play: async ({ canvasElement, step }) => {
    const store = storeOf(canvasElement);
    let panel = await openPopover(canvasElement, 'Text');
    const trigger = () =>
      panel.querySelector('.palette-trigger') as HTMLButtonElement;

    await step('Escape closes the list but not the popover', async () => {
      await user.click(trigger());
      await findOpenMenu(within(panel));
      await pressKey('Escape');
      await waitFor(() => expect(within(panel).queryByRole('menu')).toBeNull());
      await expect(popover(canvasElement)).toBeVisible();
    });

    await step('picking Hues swaps the swatches', async () => {
      await expect(trigger()).toHaveTextContent('Neutrals');
      await user.click(trigger());
      const menu = await findOpenMenu(within(panel));
      await expect(within(menu).getAllByRole('menuitemradio').length).toBe(12);

      await user.click(
        within(menu).getByRole('menuitemradio', { name: 'Hues' })
      );
      await waitFor(() => expect(trigger()).toHaveTextContent('Hues'));
      await expect(panel.querySelectorAll('.palette .swatch').length).toBe(40);
      await expect(store.state.options.lastColorSet).toBe('hues');
    });

    await step('reopened, the popover shows Hues again', async () => {
      panel = await reopenPopover(canvasElement, 'Text');
      await expect(trigger()).toHaveTextContent('Hues');
    });
  },
};

export const CustomPicker: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the + swatch folds the custom picker in and out, and its sliders apply',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const panel = await openPopover(canvasElement, 'Text');
    const toggle = within(panel).getByRole('button', { name: 'Custom color' });

    await expect(panel.querySelector('.sv-square')).toBeNull();
    await user.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.querySelector('.sv-square')).toBeVisible();

    const alpha = panel.querySelector(
      '.alpha-slider-row .range'
    ) as HTMLInputElement;
    await setRange(alpha, 50);
    await expect(declaration(store, 'h1', 'color')).toBe(
      'rgba(42, 95, 214, 0.5)'
    );
    await expect(panel.querySelector('.alpha-slider-row')).toHaveTextContent(
      '50%'
    );

    await user.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel.querySelector('.sv-square')).toBeNull();
  },
};

export const ClearButton: StoryObj = {
  ...editor(noRule),
  name: 'Clear shows once there is a value and removes the declaration',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const panel = await openPopover(canvasElement, 'Text');
    const clear = () => within(panel).queryByRole('button', { name: 'Clear' });

    await expect(clear()).toBeNull();
    await pasteHex(panel, '#112233');
    await waitFor(() => expect(clear()).toBeVisible());

    await user.click(clear() as HTMLElement);
    await expect(declaration(store, 'h1', 'color')).toBeFalsy();
    await waitFor(() => expect(clear()).toBeNull());
    await expect(popoverHex(panel)).toHaveValue('');
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
