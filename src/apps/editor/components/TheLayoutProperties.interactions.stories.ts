import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheLayoutProperties from './TheLayoutProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import {
  declaration,
  findOpenMenu,
  numberInput,
  pageStyle,
  propertyControl,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Layout',
  tags: ['test'],
  component: TheLayoutProperties,
  parameters: { padded: false },
};

export default meta;

/* Each side of the box diagram is labelled with its ring and side. */
const boxSide = (canvasElement: HTMLElement, label: string) =>
  canvasElement.querySelector(
    `[aria-label="${label}"] input`
  ) as HTMLInputElement;

export const MarginIndependent: StoryObj = {
  ...editor(WITH_RULE),
  name: 'margin is edited independently of padding',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await user.type(boxSide(canvasElement, 'Margin Top'), '10');

    await waitFor(() =>
      expect(declaration(store, 'h1', 'margin-top')).toBe('10px')
    );
    await expect(declaration(store, 'h1', 'padding')).toBe('12px 24px');
  },
};

export const IndividualSidesIsolated: StoryObj = {
  ...editor(WITH_RULE),
  name: 'setting some sides leaves the others unset instead of zeroing them',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await user.type(boxSide(canvasElement, 'Margin Top'), '10');
    await user.type(boxSide(canvasElement, 'Margin Left'), '6');

    await waitFor(() =>
      expect(declaration(store, 'h1', 'margin-left')).toBe('6px')
    );
    await expect(declaration(store, 'h1', 'margin-top')).toBe('10px');
    await expect(declaration(store, 'h1', 'margin')).toBeUndefined();
    await expect(declaration(store, 'h1', 'margin-right')).toBeUndefined();
    await expect(declaration(store, 'h1', 'margin-bottom')).toBeUndefined();
  },
};

export const BorderControls: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the border controls read through the shorthand and update style and width',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Border');
    const style = control.querySelector('.border-style button') as HTMLElement;

    // Reads through the `border` shorthand.
    await expect(style).toHaveTextContent('Solid');
    await expect(numberInput(control)).toHaveValue('1');

    await user.click(style);
    await user.click(
      within(await findOpenMenu(canvas)).getByRole('menuitem', {
        name: 'Dashed',
      })
    );
    await expect(declaration(store, 'h1', 'border-style')).toBe('dashed');
    await expect(pageStyle(canvasElement, 'h1', 'border-top-style')).toBe(
      'dashed'
    );
    await waitFor(() => expect(style).toHaveTextContent('Dashed'));

    // The longhand written after the shorthand is what wins on the page.
    const width = numberInput(control);
    await user.type(width, '2');
    await expect(declaration(store, 'h1', 'border-width')).toBe('2px');
    await expect(pageStyle(canvasElement, 'h1', 'border-top-width')).toBe(
      '2px'
    );
  },
};

export const BorderWidthOnly: StoryObj = {
  ...editor({ css: 'h1 { border-width: 2px; }', activeSelector: 'h1' }),
  name: 'a border-width alone shows its width with no style selected',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = propertyControl(canvas, 'Border');

    await expect(numberInput(control)).toHaveValue('2');
    await expect(control.querySelector('.border-style button')).toHaveClass(
      'muted'
    );
  },
};

export const RadiusField: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the radius field applies typed values',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const input = numberInput(propertyControl(canvas, 'Radius'));

    await user.type(input, '8');
    await expect(declaration(store, 'h1', 'border-radius')).toBe('8px');
  },
};
