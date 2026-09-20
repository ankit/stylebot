import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheLayoutProperties from './TheLayoutProperties.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  declaration,
  findOpenMenu,
  propertyControl,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Interactions/Box',
  component: TheLayoutProperties,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

type Canvas = ReturnType<typeof within>;

/* A spacing control is a mode row plus a grid of labelled fields; both
   live inside the same `.spacing-control` block as its label. */
const spacing = (canvas: Canvas, label: string) =>
  propertyControl(canvas, label).closest('.spacing-control') as HTMLElement;

const modeButton = (control: HTMLElement, label: string) =>
  within(control).getByRole('button', { name: label });

const spacingInput = (control: HTMLElement, label: string) =>
  within(control)
    .getByText(label, { selector: '.spacing-field-label' })
    .closest('.spacing-field')
    ?.querySelector('.number-input') as HTMLInputElement;

export const SpacingModes = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const padding = spacing(canvas, 'Padding');

    // `12px 24px` is a vertical/horizontal pair.
    await expect(modeButton(padding, 'X & Y')).toHaveClass('active');
    await expect(spacingInput(padding, 'Vertical')).toHaveValue('12');
    await expect(spacingInput(padding, 'Horizontal')).toHaveValue('24');

    await userEvent.click(modeButton(padding, 'All'));
    const all = await waitFor(() => {
      const input = spacingInput(padding, 'All');
      expect(input).toBeInTheDocument();
      return input;
    });
    await userEvent.type(all, '8');
    await expect(declaration(store, 'h1', 'padding')).toBe('8px');

    await userEvent.click(modeButton(padding, 'Individual'));
    const top = await waitFor(() => {
      const input = spacingInput(padding, 'Top');
      expect(input).toBeInTheDocument();
      return input;
    });
    // Focusing a field selects its value, so typing replaces it.
    await userEvent.type(top, '4');
    await expect(declaration(store, 'h1', 'padding')).toBe('4px 8px 8px');

    await userEvent.click(modeButton(padding, 'None'));
    await expect(declaration(store, 'h1', 'padding')).toBeUndefined();
    await expect(declaration(store, 'h1', 'padding-top')).toBeUndefined();
  },
});

export const MarginIndependent = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const margin = spacing(canvas, 'Margin');

    await expect(modeButton(margin, 'None')).toHaveClass('active');

    await userEvent.click(modeButton(margin, 'All'));
    const all = await waitFor(() => {
      const input = spacingInput(margin, 'All');
      expect(input).toBeInTheDocument();
      return input;
    });
    await userEvent.type(all, '10');

    await expect(declaration(store, 'h1', 'margin')).toBe('10px');
    await expect(declaration(store, 'h1', 'padding')).toBe('12px 24px');
  },
});

export const BorderControls = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Border');
    const style = control.querySelector('.border-style button') as HTMLElement;

    // Reads through the `border` shorthand.
    await expect(style).toHaveTextContent('Solid');
    await expect(control.querySelector('.number-input')).toHaveValue('1');

    await userEvent.click(style);
    await userEvent.click(
      within(await findOpenMenu(canvas)).getByRole('menuitem', {
        name: 'Dashed',
      })
    );
    await expect(declaration(store, 'h1', 'border-style')).toBe('dashed');
    await waitFor(() => expect(style).toHaveTextContent('Dashed'));

    const width = control.querySelector('.number-input') as HTMLInputElement;
    await userEvent.type(width, '2');
    await expect(declaration(store, 'h1', 'border-width')).toBe('2px');
  },
});

export const BorderWidthOnly = editor(
  { css: 'h1 { border-width: 2px; }', activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const control = propertyControl(canvas, 'Border');

      await expect(control.querySelector('.number-input')).toHaveValue('2');
      await expect(control.querySelector('.border-style button')).toHaveClass(
        'muted'
      );
    },
  }
);

export const RadiusField = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Radius');
    const input = control.querySelector('.number-input') as HTMLInputElement;

    await userEvent.type(input, '8');
    await expect(declaration(store, 'h1', 'border-radius')).toBe('8px');

    await userEvent.click(control.querySelector('.number-chevron') as Element);
    const menu = await findOpenMenu(canvas);
    const preset = within(menu).getAllByRole('menuitem').at(-1) as HTMLElement;
    const value = preset.textContent?.trim();
    await userEvent.click(preset);
    await expect(declaration(store, 'h1', 'border-radius')).toBe(`${value}px`);
  },
});
