import type { Meta } from '@storybook/vue';
import { expect, fireEvent, userEvent, waitFor, within } from '@storybook/test';

import ThePresetsEditor from './ThePresetsEditor.vue';
import { editor } from '@stylebot/storybook/editor-story';
import { featureSwitch, storeOf } from '@stylebot/storybook/story-helpers';

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

export const GrayscaleToggleAndSlider = editor(magic, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const toggle = featureSwitch(canvas, 'Grayscale');

    await expect(store.getters.grayscale).toBe(0);
    await expect(grayscaleSlider(canvasElement)).toBeNull();

    await userEvent.click(toggle);
    await expect(store.getters.grayscale).toBe(100);
    await expect(store.state.css).toContain('filter: grayscale(100%)');
    await waitFor(() => expect(toggle).toBeChecked());
    await waitFor(() =>
      expect(grayscaleSlider(canvasElement)).toBeInTheDocument()
    );

    const slider = grayscaleSlider(canvasElement);
    slider.value = '40';
    await fireEvent.input(slider);
    await expect(store.getters.grayscale).toBe(40);
    await expect(store.state.css).toContain('filter: grayscale(40%)');

    await userEvent.click(toggle);
    await expect(store.getters.grayscale).toBe(0);
    await expect(store.state.css).not.toContain('grayscale(');
    await waitFor(() => expect(toggle).not.toBeChecked());
  },
});

/* Turning the preset off strips only the filter, so a colour set on the
   same element in basic mode survives the round trip. */
export const GrayscaleKeepsRestOfRule = editor(
  { ...magic, css: '.article-body { color: #ff0080; }' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const store = storeOf(canvasElement);
      const toggle = featureSwitch(canvas, 'Grayscale');

      await userEvent.click(toggle);
      await expect(store.state.css).toContain('color: #ff0080');
      await expect(store.state.css).toContain('grayscale(100%)');

      await userEvent.click(toggle);
      await expect(store.state.css).toContain('color: #ff0080');
      await expect(store.state.css).not.toContain('grayscale(');
    },
  }
);

export const ReadabilityToggle = editor(magic, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const toggle = featureSwitch(canvas, 'Readability');

    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    await expect(store.state.readability).toBe(true);
    await waitFor(() => expect(toggle).toBeChecked());

    await userEvent.click(toggle);
    await expect(store.state.readability).toBe(false);
  },
});
