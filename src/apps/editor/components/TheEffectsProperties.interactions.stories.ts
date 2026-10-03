import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheEffectsProperties from './TheEffectsProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import {
  declaration,
  numberInput,
  pageStyle,
  propertyControl,
  setRange,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Effects',
  tags: ['test'],
  component: TheEffectsProperties,
  parameters: { padded: false },
};

export default meta;

const slider = (control: HTMLElement) =>
  control.querySelector('input[type="range"]') as HTMLInputElement;

export const OpacitySlider: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the opacity slider and percent field clear at 1 and apply other values',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Opacity');

    await expect(slider(control)).toHaveValue('0.9');

    // Fully opaque is the default, so it clears the declaration.
    await setRange(slider(control), 1);
    await expect(declaration(store, 'h1', 'opacity')).toBeUndefined();

    await setRange(slider(control), 0.5);
    await expect(declaration(store, 'h1', 'opacity')).toBe('0.5');
    await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.5');
    const percent = numberInput(control);
    await waitFor(() => expect(percent).toHaveValue('50'));

    await user.clear(percent);
    await user.type(percent, '30');
    await expect(declaration(store, 'h1', 'opacity')).toBe('0.3');
  },
};

export const FilterControl: StoryObj = {
  ...editor(WITH_RULE),
  name: 'picking a filter applies its default amount, the amount field adjusts it, None clears it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Filter');
    const option = (name: string) =>
      within(control).getByRole('button', { name });

    await expect(option('None')).toHaveClass('placeholder');
    await expect(canvas.queryByText('Blur amount')).toBeNull();

    await user.click(option('Blur'));
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(4px)');

    await canvas.findByText('Blur amount');
    const amount = numberInput(propertyControl(canvas, 'Blur amount'));
    await expect(amount).toHaveValue('4');

    await user.clear(amount);
    await user.type(amount, '10');
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(10px)');
    await expect(pageStyle(canvasElement, 'h1', 'filter')).toBe('blur(10px)');

    await user.click(option('Gray'));
    await expect(declaration(store, 'h1', 'filter')).toBe('grayscale(50%)');

    await user.click(option('None'));
    await expect(declaration(store, 'h1', 'filter')).toBeUndefined();
    await waitFor(() => expect(canvas.queryByText('Gray amount')).toBeNull());
  },
};
