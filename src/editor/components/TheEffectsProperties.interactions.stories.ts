import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheEffectsProperties from './TheEffectsProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  declaration,
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
  name: 'the opacity slider clears at 1 and applies other values',
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
    await waitFor(() =>
      expect(control.querySelector('.opacity-value')).toHaveTextContent('0.5')
    );
  },
};

export const FilterControl: StoryObj = {
  ...editor(WITH_RULE),
  name: 'picking a filter applies its default amount, the slider adjusts it, None clears it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Filter');
    const option = (name: string) =>
      within(control).getByRole('button', { name });

    await expect(option('None')).toHaveClass('active');
    await expect(slider(control)).toBeNull();

    await user.click(option('Blur'));
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(4px)');
    await waitFor(() => expect(slider(control)).toBeInTheDocument());

    await setRange(slider(control), 10);
    await expect(declaration(store, 'h1', 'filter')).toBe('blur(10px)');
    await expect(pageStyle(canvasElement, 'h1', 'filter')).toBe('blur(10px)');

    await user.click(option('Gray'));
    await expect(declaration(store, 'h1', 'filter')).toBe('grayscale(50%)');

    await user.click(option('None'));
    await expect(declaration(store, 'h1', 'filter')).toBeUndefined();
    await waitFor(() => expect(slider(control)).toBeNull());
  },
};
