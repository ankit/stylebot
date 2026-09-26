import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheStylebotApp from './TheStylebotApp.vue';
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
  title: 'Tests/Editor/Undo',
  tags: ['test'],
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

const slider = (control: HTMLElement) =>
  control.querySelector('input[type="range"]') as HTMLInputElement;

// The handler reads the platform's own modifier, so the story presses the
// one the browser running it reports.
const modifier = /mac/i.test(navigator.platform) ? 'Meta' : 'Control';

const pressUndo = () => user.keyboard(`{${modifier}>}z{/${modifier}}`);
const pressRedo = () =>
  user.keyboard(`{${modifier}>}{Shift>}z{/Shift}{/${modifier}}`);

/**
 * What the code editor's iframe posts when its text changes; Storybook
 * stubs the iframe, so the story posts it the same way.
 */
const typeInCodeEditor = (css: string) =>
  window.postMessage({ type: 'stylebotMonacoIframeCssUpdated', css }, '*');

export const UndoRedoBasicChange: StoryObj = {
  ...editor(WITH_RULE),
  name: 'undo reverts a Basic-mode change in the panel and on the page, redo restores it',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Opacity');

    await expect(slider(control)).toHaveValue('0.9');

    await setRange(slider(control), 0.5);
    await expect(declaration(store, 'h1', 'opacity')).toBe('0.5');
    await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.5');

    await step('undo', async () => {
      await pressUndo();

      await expect(declaration(store, 'h1', 'opacity')).toBe('0.9');
      await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.9');
      await waitFor(() => expect(slider(control)).toHaveValue('0.9'));
    });

    await step('redo', async () => {
      await pressRedo();

      await expect(declaration(store, 'h1', 'opacity')).toBe('0.5');
      await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.5');
      await waitFor(() => expect(slider(control)).toHaveValue('0.5'));
    });
  },
};

export const SliderDragIsOneStep: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a slider drag undoes in one step',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const control = propertyControl(canvas, 'Opacity');

    for (const value of [0.8, 0.7, 0.6, 0.5, 0.4]) {
      await setRange(slider(control), value);
    }
    await expect(declaration(store, 'h1', 'opacity')).toBe('0.4');
    await expect(store.state.undoStack.past).toHaveLength(1);

    await pressUndo();

    await expect(declaration(store, 'h1', 'opacity')).toBe('0.9');
    await expect(pageStyle(canvasElement, 'h1', 'opacity')).toBe('0.9');
    await expect(store.getters.canUndo).toBe(false);
  },
};

export const ClearAllInCodeMode: StoryObj = {
  ...editor({ ...WITH_RULE, options: { mode: 'code' } }),
  name: 'clearing everything in code mode can be undone',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const before = store.state.css;

    await expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
      'rgb(42, 95, 214)'
    );

    typeInCodeEditor('');
    await waitFor(() => expect(store.state.css).toBe(''));
    await expect(pageStyle(canvasElement, 'h1', 'color')).not.toBe(
      'rgb(42, 95, 214)'
    );

    await pressUndo();

    await expect(store.state.css).toBe(before);
    await expect(pageStyle(canvasElement, 'h1', 'color')).toBe(
      'rgb(42, 95, 214)'
    );
  },
};
