import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import ThePresetsEditor from './ThePresetsEditor.vue';
import { editor } from '@stylebot/storybook/editor-story';
import {
  featureSwitch,
  setRange,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Presets',
  tags: ['test'],
  component: ThePresetsEditor,
  parameters: { padded: false },
};

export default meta;

const magic = { options: { mode: 'magic' as const } };

const grayscaleSlider = (root: HTMLElement) =>
  root.querySelector('.presets-editor input[type="range"]') as HTMLInputElement;

// The preset targets body's element children, which here is the
// Storybook root the page sits in.
const rootFilter = () =>
  getComputedStyle(document.getElementById('storybook-root') as Element).filter;

export const GrayscaleToggleAndSlider: StoryObj = {
  ...editor(magic),
  name: 'the grayscale toggle applies 100%, the slider adjusts it, and off clears it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const toggle = featureSwitch(canvas, 'Grayscale');

    await expect(store.getters.grayscale).toBe(0);
    await expect(grayscaleSlider(canvasElement)).toBeNull();

    await user.click(toggle);
    await expect(store.getters.grayscale).toBe(100);
    await expect(store.state.css).toContain('filter: grayscale(100%)');
    await expect(rootFilter()).toBe('grayscale(1)');
    await waitFor(() => expect(toggle).toBeChecked());
    await waitFor(() =>
      expect(grayscaleSlider(canvasElement)).toBeInTheDocument()
    );

    await setRange(grayscaleSlider(canvasElement), 40);
    await expect(store.getters.grayscale).toBe(40);
    await expect(store.state.css).toContain('filter: grayscale(40%)');

    await user.click(toggle);
    await expect(store.getters.grayscale).toBe(0);
    await expect(store.state.css).not.toContain('grayscale(');
    await expect(rootFilter()).toBe('none');
    await waitFor(() => expect(toggle).not.toBeChecked());
  },
};

/* Turning the preset off strips only the filter, so a colour set on the
   same element in basic mode survives the round trip. */
export const GrayscaleKeepsRestOfRule: StoryObj = {
  ...editor({ ...magic, css: '.article-body { color: #ff0080; }' }),
  name: 'taking grayscale back to 0 keeps the rest of the rule',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const toggle = featureSwitch(canvas, 'Grayscale');

    await user.click(toggle);
    await expect(store.state.css).toContain('color: #ff0080');
    await expect(store.state.css).toContain('grayscale(100%)');

    await user.click(toggle);
    await expect(store.state.css).toContain('color: #ff0080');
    await expect(store.state.css).not.toContain('grayscale(');
  },
};

export const ReadabilityToggle: StoryObj = {
  ...editor(magic),
  name: 'the readability toggle turns reader mode on and off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const toggle = featureSwitch(canvas, 'Readability');

    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();

    await user.click(toggle);
    await expect(store.state.readability).toBe(true);
    await waitFor(() => expect(toggle).toBeChecked());

    await user.click(toggle);
    await expect(store.state.readability).toBe(false);
  },
};
