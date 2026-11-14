import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheInspector from './TheInspector.vue';
import {
  editor,
  IFRAME_PAGE,
  INSPECT_PAGE,
} from '@stylebot/storybook/fixtures/editor';
import {
  hoverPage,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

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
    Array.from(root.querySelectorAll(`${scope} .part`)).at(-1)?.textContent ??
    ''
  ).trim();

const hoverLabel = () =>
  (document.querySelector('.inspect-card .name')?.textContent ?? '').trim();
const hoverSize = () =>
  (document.querySelector('.inspect-card .size')?.textContent ?? '').trim();
const selectorChip = (root: HTMLElement) =>
  lastChipText(root, '.selector-autocomplete .autocomplete-chips');

export const ButtonAndShortcutToggle: StoryObj = {
  ...editor({ activeSelector: 'h1', css: 'h1 { color: red; }' }),
  name: 'the inspector button and i toggle inspecting and clear the selector',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const button = inspector(canvasElement);

    await user.click(button);
    await expect(store.state.inspecting).toBe(true);
    await expect(store.state.activeSelector).toBe('');
    await waitFor(() => expect(button).toHaveClass('active'));

    // The panel stays clickable while picking: this is the button, not
    // an element being picked.
    await user.click(button);
    await expect(store.state.inspecting).toBe(false);
    await waitFor(() => expect(button).not.toHaveClass('active'));

    await pressKey('i');
    await expect(store.state.inspecting).toBe(true);

    await pressKey('i');
    await expect(store.state.inspecting).toBe(false);
  },
};

export const SwitchingModeStops: StoryObj = {
  ...editor({ inspecting: true }),
  name: 'switching to Code stops inspecting',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const button = inspector(canvasElement);

    await store.dispatch('setMode', 'code');
    await expect(store.state.inspecting).toBe(false);

    await store.dispatch('setMode', 'basic');
    await waitFor(() => expect(button).not.toHaveClass('active'));
  },
};

export const PickSetsSelector: StoryObj = {
  ...editor({ inspecting: true }),
  name: 'picking an element sets the selector, leaves inspecting and focuses the inspector button',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await hoverPage(canvas.getByRole('heading', { level: 1 }));
    await waitFor(() => expect(hoverLabel()).toBe('h1'));

    await pressKey('Enter');

    await expect(store.state.inspecting).toBe(false);
    await expect(store.state.activeSelector).toMatch(/\bh1$/);
    await waitFor(() => expect(selectorChip(canvasElement)).toMatch(/\bh1$/));
    await expect(inspector(canvasElement).classList.contains('active')).toBe(
      false
    );
    await expect(inspector(canvasElement)).toHaveFocus();
  },
};

export const InspectsInCode: StoryObj = {
  ...editor({ options: { mode: 'code' } }),
  name: 'the inspector picks an element in Code too',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const button = inspector(canvasElement);

    await expect(button).toBeEnabled();
    await user.click(button);
    await expect(store.state.inspecting).toBe(true);

    // Inspecting starts mid-play, so headless Chromium can re-hover its real
    // cursor at the origin after our hover; hover again until the h1 holds.
    const heading = canvas.getByRole('heading', { level: 1 });
    await waitFor(async () => {
      await hoverPage(heading);
      await expect(hoverLabel()).toBe('h1');
    });
    await pressKey('Enter');

    await expect(store.state.inspecting).toBe(false);
    await expect(store.state.activeSelector).toMatch(/\bh1$/);
    await expect(store.state.options.mode).toBe('code');
  },
};

export const BoxesHoveredElementOnly: StoryObj = {
  ...editor({ inspecting: true }),
  name: "hovering an element boxes it alone, not the selector's other matches",
  play: async ({ canvasElement }) => {
    const [first] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.article-body')
    );

    await hoverPage(first);
    await waitFor(() => expect(hoverLabel()).toBe('p.article-body'));

    await expect(
      document.querySelectorAll('#stylebot-overlay .stylebot-overlay-rect')
    ).toHaveLength(1);
  },
};

export const ArrowKeysClimbAncestors: StoryObj = {
  ...editor({ inspecting: true }, { page: INSPECT_PAGE }),
  name: 'arrow keys climb and descend ancestors while picking an element',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const link = canvas.getByRole('link', { name: 'Learn more' });

    await step('hovering shows the element and its size', async () => {
      await hoverPage(link);
      await waitFor(() => expect(hoverLabel()).toBe('a'));

      const { width, height } = link.getBoundingClientRect();
      await expect(hoverSize()).toBe(
        `${Math.round(width)} × ${Math.round(height)}`
      );
    });

    await step('ArrowUp climbs, ArrowDown descends', async () => {
      await pressKey('ArrowUp');
      await waitFor(() => expect(hoverLabel()).toBe('p'));

      await pressKey('ArrowDown');
      await waitFor(() => expect(hoverLabel()).toBe('a'));
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

      // The pointer is still over the link from before; leave and re-enter.
      await user.unhover(link);
      await hoverPage(link);
      await waitFor(() => expect(hoverLabel()).toBe('a'));

      for (let i = 0; i < 10; i++) {
        await pressKey('ArrowUp');
      }

      await waitFor(() => expect(hoverLabel()).toBe('html'));

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

    await hoverPage(frame);
    await waitFor(() => expect(hoverLabel()).toBe('iframe'));

    // The overlay rect shields the frame so the click stays in this
    // document instead of reaching the ad inside.
    const rect = document.querySelector(
      '#stylebot-overlay .stylebot-overlay-rect'
    ) as HTMLElement;
    await expect(rect.style.pointerEvents).toBe('auto');

    await user.click(rect);

    await expect(store.state.inspecting).toBe(false);
    await expect(store.state.activeSelector).toBe('iframe[name="ad"]');
    await waitFor(() => expect(selectorChip(canvasElement)).toMatch(/iframe/));
  },
};
