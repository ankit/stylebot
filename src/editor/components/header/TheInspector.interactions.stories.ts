import type { Meta, StoryObj } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheInspector from './TheInspector.vue';
import {
  editor,
  IFRAME_PAGE,
  INSPECT_PAGE,
} from '@stylebot/storybook/editor-story';
import { pressKey, storeOf } from '@stylebot/storybook/story-helpers';

/* While inspecting, the highlighter treats everything outside the real
   extension's shadow host as page content — including the panel here. So
   these stories drive picking with hover + keyboard and only touch the
   panel once inspecting is off. */
const meta: Meta = {
  title: 'Tests/Editor/Inspector',
  tags: ['test'],
  component: TheInspector,
  parameters: { padded: false },
};

export default meta;

const inspector = (root: HTMLElement) =>
  root.querySelector('.stylebot-inspector') as HTMLElement;

const lastChipText = (root: ParentNode, scope: string) =>
  (
    Array.from(root.querySelectorAll(`${scope} .chip`)).at(-1)?.textContent ??
    ''
  ).trim();

const currentChip = () =>
  lastChipText(document, '.inspect-card .row:not(.next-row)');
const nextChip = () => lastChipText(document, '.inspect-card .next-row');
const selectorChip = (root: HTMLElement) =>
  lastChipText(root, '.selector-autocomplete .autocomplete-chips');

export const ButtonAndShortcutToggle: StoryObj = {
  ...editor({ activeSelector: 'h1', css: 'h1 { color: red; }' }),
  name: 'the inspector button and i toggle inspecting and clear the selector',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const button = inspector(canvasElement);

    await userEvent.click(button);
    await expect(store.state.inspecting).toBe(true);
    await expect(store.state.activeSelector).toBe('');
    await waitFor(() => expect(button).toHaveClass('active'));

    await pressKey('i');
    await expect(store.state.inspecting).toBe(false);
    await waitFor(() => expect(button).not.toHaveClass('active'));

    await pressKey('i');
    await expect(store.state.inspecting).toBe(true);
  },
};

export const PickSetsSelector: StoryObj = {
  ...editor({ inspecting: true }),
  name: 'picking an element sets the selector and leaves inspecting',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await userEvent.hover(canvas.getByRole('heading', { level: 1 }));
    await waitFor(() => expect(currentChip()).toMatch(/\bh1$/));

    await pressKey('Enter');

    await expect(store.state.inspecting).toBe(false);
    await expect(store.state.activeSelector).toMatch(/\bh1$/);
    await waitFor(() => expect(selectorChip(canvasElement)).toMatch(/\bh1$/));
    await expect(inspector(canvasElement).classList.contains('active')).toBe(
      false
    );
  },
};

export const ArrowKeysClimbAncestors: StoryObj = {
  ...editor({ inspecting: true }, { page: INSPECT_PAGE }),
  name: 'arrow keys climb and descend ancestors while picking an element',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const link = canvas.getByRole('link', { name: 'Learn more' });

    await step('hovering shows the element and offers its parent', async () => {
      await userEvent.hover(link);
      await waitFor(() => expect(currentChip()).toMatch(/\ba$/));
      await expect(nextChip()).toMatch(/\bp$/);
    });

    await step('ArrowUp climbs, ArrowDown descends', async () => {
      await pressKey('ArrowUp');
      await waitFor(() => expect(currentChip()).toMatch(/\bp$/));
      await expect(nextChip()).toMatch(/\bmain$/);

      await pressKey('ArrowDown');
      await waitFor(() => expect(currentChip()).toMatch(/\ba$/));
    });

    await step(
      'Enter selects the climbed-to element, not the hovered one',
      async () => {
        await pressKey('ArrowUp');
        await pressKey('Enter');

        await expect(store.state.inspecting).toBe(false);
        await waitFor(() =>
          expect(selectorChip(canvasElement)).toMatch(/\bp$/)
        );
      }
    );

    await step('there is nothing above <html>', async () => {
      await pressKey('i');
      await expect(store.state.inspecting).toBe(true);

      await userEvent.hover(link);
      await waitFor(() => expect(currentChip()).toMatch(/\ba$/));

      for (let i = 0; i < 10; i++) {
        await pressKey('ArrowUp');
      }

      await waitFor(() => expect(currentChip()).toBe('html'));
      await expect(
        document.querySelector('.inspect-card .next-row')
      ).toBeNull();

      await pressKey('Enter');
      await waitFor(() => expect(selectorChip(canvasElement)).toBe('html'));
    });
  },
};

export const ClickOnIframeSelectsIt: StoryObj = {
  ...editor({ inspecting: true }, { page: IFRAME_PAGE }),
  name: 'clicking an iframe while picking selects it instead of activating its content',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const frame = canvasElement.querySelector('iframe') as HTMLElement;

    await userEvent.hover(frame);
    await waitFor(() => expect(currentChip()).toMatch(/iframe/));

    // The overlay rect shields the frame so the click stays in this
    // document instead of reaching the ad inside.
    const rect = document.querySelector(
      '#stylebot-overlay > div'
    ) as HTMLElement;
    await expect(rect.style.pointerEvents).toBe('auto');

    await userEvent.click(rect);

    await expect(store.state.inspecting).toBe(false);
    await expect(store.state.activeSelector).toBe('iframe[name="ad"]');
    await waitFor(() => expect(selectorChip(canvasElement)).toMatch(/iframe/));
  },
};
