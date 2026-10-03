import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheLayoutProperties from './TheLayoutProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import type { Canvas } from '@stylebot/storybook/story-helpers';
import {
  cardHeader,
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

/* A spacing control is a row with a mode dropdown and its fields; Individual
   moves the four side fields onto a grid below, inside the same block. */
const spacing = (canvas: Canvas, label: string) =>
  propertyControl(canvas, label).closest('.spacing-control') as HTMLElement;

const pickMode = async (canvas: Canvas, control: HTMLElement, mode: string) => {
  await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
  await user.click(control.querySelector('.select-trigger') as Element);
  await user.click(
    within(await findOpenMenu(canvas)).getByRole('menuitem', { name: mode })
  );
};

// Fields are told apart by their X / Y / T / R / B / L prefix; a lone field has none.
const spacingInput = async (control: HTMLElement, prefix = '') => {
  if (!prefix) {
    return control.querySelector('.number-input') as HTMLInputElement;
  }

  return numberInput(
    (
      await within(control).findByText(prefix, { selector: '.number-prefix' })
    ).closest('.spacing-field') as HTMLElement
  );
};

export const SpacingModes: StoryObj = {
  ...editor(WITH_RULE),
  name: 'padding switches between All sides, X & Y and Individual and writes the right shorthand',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const padding = spacing(canvas, 'Padding');

    // `12px 24px` is a vertical/horizontal pair.
    await expect(padding.querySelector('.select-trigger')).toHaveTextContent(
      'X & Y'
    );
    await expect(await spacingInput(padding, 'Y')).toHaveValue('12');
    await expect(await spacingInput(padding, 'X')).toHaveValue('24');

    await pickMode(canvas, padding, 'All sides');
    const all = await spacingInput(padding);
    await user.type(all, '8');
    await expect(declaration(store, 'h1', 'padding')).toBe('8px');
    await expect(pageStyle(canvasElement, 'h1', 'padding')).toBe('8px');

    await pickMode(canvas, padding, 'Individual');
    const top = await spacingInput(padding, 'T');
    // Focusing a field selects its value, so typing replaces it.
    await user.type(top, '4');
    await expect(declaration(store, 'h1', 'padding')).toBe('4px 8px 8px');
    await expect(pageStyle(canvasElement, 'h1', 'padding-top')).toBe('4px');
    await expect(pageStyle(canvasElement, 'h1', 'padding-left')).toBe('8px');

    // An empty field means none.
    await pickMode(canvas, padding, 'All sides');
    await user.type(await spacingInput(padding), '3');
    await user.clear(await spacingInput(padding));
    await expect(declaration(store, 'h1', 'padding')).toBeUndefined();
    await expect(declaration(store, 'h1', 'padding-top')).toBeUndefined();
    await expect(pageStyle(canvasElement, 'h1', 'padding')).toBe('0px');
  },
};

export const SpacingPlaceholders: StoryObj = {
  ...editor({ ...WITH_RULE, activeSelector: '.sb-page p' }),
  name: "spacing fields show the page's computed sides, and a combined field only when they agree",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    await user.click(cardHeader(canvas, 'Box'));
    const margin = spacing(canvas, 'Margin');

    await pickMode(canvas, margin, 'Individual');
    const bottom = await spacingInput(margin, 'B');
    await waitFor(() => expect(bottom).toHaveAttribute('placeholder', '12'));
    await expect(bottom).toHaveValue('');
    await expect(await spacingInput(margin, 'T')).toHaveAttribute(
      'placeholder',
      '0'
    );

    // `0 0 12px` has no single value to show.
    await pickMode(canvas, margin, 'All sides');
    await expect(await spacingInput(margin)).toHaveAttribute(
      'placeholder',
      '—'
    );
    await expect(declaration(store, '.sb-page p', 'margin')).toBeUndefined();
  },
};

export const MarginIndependent: StoryObj = {
  ...editor(WITH_RULE),
  name: 'margin is edited independently of padding',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const margin = spacing(canvas, 'Margin');

    await user.type(await spacingInput(margin), '10');

    await expect(declaration(store, 'h1', 'margin')).toBe('10px');
    await expect(declaration(store, 'h1', 'padding')).toBe('12px 24px');
  },
};

export const IndividualSidesIsolated: StoryObj = {
  ...editor(WITH_RULE),
  name: 'setting some individual sides leaves the others unset instead of zeroing them',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const margin = spacing(canvas, 'Margin');

    await pickMode(canvas, margin, 'Individual');
    await user.type(await spacingInput(margin, 'T'), '10');
    await user.type(await spacingInput(margin, 'L'), '6');

    await expect(declaration(store, 'h1', 'margin-top')).toBe('10px');
    await expect(declaration(store, 'h1', 'margin-left')).toBe('6px');
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
