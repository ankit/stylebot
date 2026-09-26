import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheStylebotApp from './TheStylebotApp.vue';
import { defaultOptions } from '@stylebot/settings';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import { storeOf, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Resize',
  tags: ['test'],
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

const panel = (root: HTMLElement) =>
  root.querySelector('.stylebot-docked') as HTMLElement;

const panelWidth = (root: HTMLElement) => parseInt(panel(root).style.width);

const edge = (root: HTMLElement) =>
  within(root).getByRole('separator', { name: 'Resize the panel' });

/**
 * Presses on the panel's edge and moves it by `dx` pixels, releasing only
 * when asked so a play can look at the panel mid-drag.
 */
const dragEdge = async (
  root: HTMLElement,
  dx: number,
  { release = true }: { release?: boolean } = {}
): Promise<void> => {
  const target = edge(root);
  const rect = target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  await user.pointer([
    { keys: '[MouseLeft>]', target, coords: { clientX: x, clientY: y } },
    { target, coords: { clientX: x + dx, clientY: y } },
  ]);

  if (release) {
    await user.pointer({ keys: '[/MouseLeft]', target });
  }
};

export const DragToResize: StoryObj = {
  ...editor(WITH_RULE),
  name: 'dragging the edge resizes the panel and saves the width on release',
  play: async ({ canvasElement, step }) => {
    const store = storeOf(canvasElement);
    const start = store.state.options.layout.width;

    await expect(panelWidth(canvasElement)).toBe(start);

    await step('the panel follows the pointer without saving', async () => {
      await dragEdge(canvasElement, -100, { release: false });
      await waitFor(() => expect(panelWidth(canvasElement)).toBe(start + 100));
      await expect(store.state.options.layout.width).toBe(start);
    });

    await step('releasing saves the new width', async () => {
      await user.pointer({ keys: '[/MouseLeft]', target: edge(canvasElement) });
      await expect(store.state.options.layout.width).toBe(start + 100);
      await expect(panelWidth(canvasElement)).toBe(start + 100);
    });
  },
};

export const DockedLeft: StoryObj = {
  ...editor({
    ...WITH_RULE,
    options: { layout: { ...defaultOptions.layout, dockLocation: 'left' } },
  }),
  name: 'docked left, dragging the edge right widens the panel',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const start = store.state.options.layout.width;

    await dragEdge(canvasElement, 80);
    await expect(store.state.options.layout.width).toBe(start + 80);
  },
};

export const Clamped: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the width stays between the minimum and 60% of the page',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await dragEdge(canvasElement, -window.innerWidth);
    await expect(store.state.options.layout.width).toBe(
      Math.round(window.innerWidth * 0.6)
    );

    await dragEdge(canvasElement, window.innerWidth);
    await expect(store.state.options.layout.width).toBe(340);
  },
};

export const DoubleClickResets: StoryObj = {
  ...editor(WITH_RULE),
  name: 'double-clicking the edge resets the default width',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const start = store.state.options.layout.width;

    await dragEdge(canvasElement, -120);
    await expect(store.state.options.layout.width).toBe(start + 120);

    await user.dblClick(edge(canvasElement));
    await expect(store.state.options.layout.width).toBe(
      defaultOptions.layout.width
    );
  },
};

export const KeyboardResize: StoryObj = {
  ...editor(WITH_RULE),
  name: 'arrow keys on the focused edge resize the panel',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const start = store.state.options.layout.width;

    edge(canvasElement).focus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(store.state.options.layout.width).toBe(start + 32);

    await user.keyboard('{ArrowRight}');
    await expect(store.state.options.layout.width).toBe(start + 16);
  },
};
