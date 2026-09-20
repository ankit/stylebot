import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, userEvent, waitFor, within } from '@storybook/test';

import TheEffectsProperties from './TheEffectsProperties.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  declaration,
  propertyControl,
  pageStyle,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Effects',
  tags: ['test'],
  component: TheEffectsProperties,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

const slider = (control: HTMLElement) =>
  control.querySelector('input[type="range"]') as HTMLInputElement;

// A range input can't be dragged by user-event; set it like the browser
// would and fire the input event the component listens for.
const slide = async (input: HTMLInputElement, value: number) => {
  input.value = String(value);
  await fireEvent.input(input);
};

export const OpacitySlider: StoryObj = {
  ...editor(withRule),
  name: 'the opacity slider clears at 1 and applies other values',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Opacity');

    await expect(slider(control)).toHaveValue('0.9');

    // Fully opaque is the default, so it clears the declaration.
    await slide(slider(control), 1);
    await expect(declaration(store, 'h1', 'opacity')).toBeUndefined();

    await slide(slider(control), 0.5);
    await expect(declaration(store, 'h1', 'opacity')).toBe('0.5');
    await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.5');
    await waitFor(() =>
      expect(control.querySelector('.opacity-value')).toHaveTextContent('0.5')
    );
  },
};

export const FilterControl: StoryObj = {
  ...editor(withRule),
  name: 'picking a filter applies its default amount, the slider adjusts it, None clears it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Filter');
    const option = (name: string) =>
      within(control).getByRole('button', { name });

    await expect(option('None')).toHaveClass('active');
    await expect(slider(control)).toBeNull();

    await userEvent.click(option('Blur'));
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(4px)');
    await waitFor(() => expect(slider(control)).toBeInTheDocument());

    await slide(slider(control), 10);
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(10px)');
    await expect(pageStyle(canvasElement, 'h1', 'filter')).toBe('blur(10px)');

    await userEvent.click(option('Gray'));
    await expect(declaration(store, 'h1', 'filter')).toBe('grayscale(50%)');

    await userEvent.click(option('None'));
    await expect(declaration(store, 'h1', 'filter')).toBeUndefined();
    await waitFor(() => expect(slider(control)).toBeNull());
  },
};
