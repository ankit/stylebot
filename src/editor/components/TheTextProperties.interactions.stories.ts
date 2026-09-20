import type { Meta, StoryObj } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheTextProperties from './TheTextProperties.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  declaration,
  findOpenMenu,
  propertyControl,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Text',
  tags: ['test'],
  component: TheTextProperties,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

const numberInput = (control: HTMLElement) =>
  control.querySelector('.number-input') as HTMLInputElement;

// Segment buttons are labelled by icon or glyph, so they go by position.
const segments = (control: HTMLElement) =>
  Array.from(control.querySelectorAll<HTMLElement>('.segment'));

export const FontSizeField: StoryObj = {
  ...editor(withRule),
  name: 'the size field applies px values live, clears them, and offers presets',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Size');
    const input = numberInput(control);

    await expect(input).toHaveValue('32');

    // Every keystroke applies, so the field is live rather than committed.
    await userEvent.clear(input);
    await userEvent.type(input, '20');
    await expect(declaration(store, 'h1', 'font-size')).toBe('20px');

    await userEvent.clear(input);
    await expect(declaration(store, 'h1', 'font-size')).toBeUndefined();

    await userEvent.click(control.querySelector('.number-chevron') as Element);
    const menu = await findOpenMenu(canvas);
    await userEvent.click(within(menu).getAllByRole('menuitem')[0]);
    await waitFor(() => expect(input.value).not.toBe(''));
    await expect(declaration(store, 'h1', 'font-size')).toBe(
      `${input.value}px`
    );
  },
};

/* Only px is editable; a unitless or other-unit value renders empty and is
   replaced on edit. */
export const LineHeightField: StoryObj = {
  ...editor({ css: RULE_CSS, activeSelector: '.article-body' }),
  name: 'a non-px line height renders empty and is replaced on edit',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const input = numberInput(propertyControl(canvas, 'Line Height'));

    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '1.6'
    );
    await expect(input).toHaveValue('');

    await userEvent.type(input, '24');
    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '24px'
    );
  },
};

export const TextAlignSegmented: StoryObj = {
  ...editor(withRule),
  name: 'clicking the active alignment clears it; another applies it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const [left, center] = segments(propertyControl(canvas, 'Alignment'));

    await expect(center).toHaveClass('active');

    // Clicking the active option clears the declaration.
    await userEvent.click(center);
    await expect(declaration(store, 'h1', 'text-align')).toBeUndefined();
    await waitFor(() => expect(center).not.toHaveClass('active'));

    await userEvent.click(left);
    await expect(declaration(store, 'h1', 'text-align')).toBe('left');
    await waitFor(() => expect(left).toHaveClass('active'));
  },
};

export const TextDecorationSegmented: StoryObj = {
  ...editor(withRule),
  name: 'a decoration applies on click and clears on a second click',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const [underline] = segments(propertyControl(canvas, 'Decoration'));

    await userEvent.click(underline);
    await expect(declaration(store, 'h1', 'text-decoration')).toBe('underline');
    await waitFor(() => expect(underline).toHaveClass('active'));

    await userEvent.click(underline);
    await expect(declaration(store, 'h1', 'text-decoration')).toBeUndefined();
  },
};
