import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheTextProperties from './TheTextProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  declaration,
  findOpenMenu,
  numberInput,
  pageStyle,
  pressKey,
  propertyControl,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Text',
  tags: ['test'],
  component: TheTextProperties,
  parameters: { padded: false },
};

export default meta;

// Segment buttons are labelled by icon or glyph, so they go by position.
const segments = (control: HTMLElement) =>
  Array.from(control.querySelectorAll<HTMLElement>('.segment'));

export const FontSizeField: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the size field applies px values live, clears them, and offers presets',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Size');
    const input = numberInput(control);

    await expect(input).toHaveValue('32');

    // Every keystroke applies, so the field is live rather than committed.
    await user.clear(input);
    await user.type(input, '20');
    await expect(declaration(store, 'h1', 'font-size')).toBe('20px');
    await expect(pageStyle(canvasElement, 'h1', 'font-size')).toBe('20px');

    await user.clear(input);
    await expect(declaration(store, 'h1', 'font-size')).toBeUndefined();

    await user.click(control.querySelector('.number-chevron') as Element);
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getAllByRole('menuitem')[0]);
    await waitFor(() => expect(input.value).not.toBe(''));
    await expect(declaration(store, 'h1', 'font-size')).toBe(
      `${input.value}px`
    );
  },
};

/* Only px is editable; a unitless or other-unit value renders empty and is
   replaced on edit. */
export const LineHeightField: StoryObj = {
  ...editor({ ...WITH_RULE, activeSelector: '.article-body' }),
  name: 'a non-px line height renders empty and is replaced on edit',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const input = numberInput(propertyControl(canvas, 'Line Height'));

    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '1.6'
    );
    await expect(input).toHaveValue('');

    await user.type(input, '24');
    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '24px'
    );
  },
};

export const ComputedPlaceholders: StoryObj = {
  ...editor({ ...WITH_RULE, activeSelector: '.sb-page p' }),
  name: "unset sizes show the page's computed px as placeholders, and arrows step from them",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const size = numberInput(propertyControl(canvas, 'Size'));
    const lineHeight = numberInput(propertyControl(canvas, 'Line Height'));

    await waitFor(() => expect(size).toHaveAttribute('placeholder', '16'));
    await expect(size).toHaveValue('');
    await expect(lineHeight).toHaveAttribute('placeholder', '25.6');

    await user.click(size);
    await pressKey('ArrowUp');
    await expect(declaration(store, '.sb-page p', 'font-size')).toBe('17px');
    await waitFor(() =>
      expect(lineHeight).toHaveAttribute('placeholder', '27.2')
    );

    await user.clear(size);
    await waitFor(() =>
      expect(lineHeight).toHaveAttribute('placeholder', '25.6')
    );
  },
};

export const TextAlignSegmented: StoryObj = {
  ...editor(WITH_RULE),
  name: 'clicking the active alignment clears it; another applies it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const [left, center] = segments(propertyControl(canvas, 'Alignment'));

    await expect(center).toHaveClass('active');

    // Clicking the active option clears the declaration.
    await user.click(center);
    await expect(declaration(store, 'h1', 'text-align')).toBeUndefined();
    await waitFor(() => expect(center).not.toHaveClass('active'));

    await user.click(left);
    await expect(declaration(store, 'h1', 'text-align')).toBe('left');
    await expect(pageStyle(canvasElement, 'h1', 'text-align')).toBe('left');
    await waitFor(() => expect(left).toHaveClass('active'));
  },
};

export const TextDecorationSegmented: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a decoration applies on click and clears on a second click',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const [underline] = segments(propertyControl(canvas, 'Decoration'));

    await user.click(underline);
    await expect(declaration(store, 'h1', 'text-decoration')).toBe('underline');
    await waitFor(() => expect(underline).toHaveClass('active'));

    await user.click(underline);
    await expect(declaration(store, 'h1', 'text-decoration')).toBeUndefined();
  },
};
