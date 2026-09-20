import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheLayoutProperties from './TheLayoutProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  Canvas,
  declaration,
  findOpenMenu,
  numberInput,
  pageStyle,
  propertyControl,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Box',
  tags: ['test'],
  component: TheLayoutProperties,
  parameters: { padded: false },
};

export default meta;

/* A spacing control is a mode row plus a grid of labelled fields; both
   live inside the same `.spacing-control` block as its label. */
const spacing = (canvas: Canvas, label: string) =>
  propertyControl(canvas, label).closest('.spacing-control') as HTMLElement;

const modeButton = (control: HTMLElement, label: string) =>
  within(control).getByRole('button', { name: label });

// Fields appear when a mode is picked, so this waits for the label.
const spacingInput = async (control: HTMLElement, label: string) =>
  numberInput(
    (
      await within(control).findByText(label, {
        selector: '.spacing-field-label',
      })
    ).closest('.spacing-field') as HTMLElement
  );

export const SpacingModes: StoryObj = {
  ...editor(WITH_RULE),
  name: 'padding switches between All, X & Y, Individual and None and writes the right shorthand',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const padding = spacing(canvas, 'Padding');

    // `12px 24px` is a vertical/horizontal pair.
    await expect(modeButton(padding, 'X & Y')).toHaveClass('active');
    await expect(await spacingInput(padding, 'Vertical')).toHaveValue('12');
    await expect(await spacingInput(padding, 'Horizontal')).toHaveValue('24');

    await user.click(modeButton(padding, 'All'));
    const all = await spacingInput(padding, 'All');
    await user.type(all, '8');
    await expect(declaration(store, 'h1', 'padding')).toBe('8px');
    await expect(pageStyle(canvasElement, 'h1', 'padding')).toBe('8px');

    await user.click(modeButton(padding, 'Individual'));
    const top = await spacingInput(padding, 'Top');
    // Focusing a field selects its value, so typing replaces it.
    await user.type(top, '4');
    await expect(declaration(store, 'h1', 'padding')).toBe('4px 8px 8px');
    await expect(pageStyle(canvasElement, 'h1', 'padding-top')).toBe('4px');
    await expect(pageStyle(canvasElement, 'h1', 'padding-left')).toBe('8px');

    await user.click(modeButton(padding, 'None'));
    await expect(declaration(store, 'h1', 'padding')).toBeUndefined();
    await expect(declaration(store, 'h1', 'padding-top')).toBeUndefined();
    await expect(pageStyle(canvasElement, 'h1', 'padding')).toBe('0px');
  },
};

export const MarginIndependent: StoryObj = {
  ...editor(WITH_RULE),
  name: 'margin is edited independently of padding',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const margin = spacing(canvas, 'Margin');

    await expect(modeButton(margin, 'None')).toHaveClass('active');

    await user.click(modeButton(margin, 'All'));
    const all = await spacingInput(margin, 'All');
    await user.type(all, '10');

    await expect(declaration(store, 'h1', 'margin')).toBe('10px');
    await expect(declaration(store, 'h1', 'padding')).toBe('12px 24px');
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
  name: 'the radius field applies typed and preset values',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Radius');
    const input = numberInput(control);

    await user.type(input, '8');
    await expect(declaration(store, 'h1', 'border-radius')).toBe('8px');

    await user.click(control.querySelector('.number-chevron') as Element);
    const menu = await findOpenMenu(canvas);
    const preset = within(menu).getAllByRole('menuitem').at(-1) as HTMLElement;
    const value = preset.textContent?.trim();
    await user.click(preset);
    await expect(declaration(store, 'h1', 'border-radius')).toBe(`${value}px`);
  },
};
