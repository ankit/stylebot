import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheInspector from './TheInspector.vue';
import {
  editor,
  IFRAME_PAGE,
  INSPECT_PAGE,
} from '@stylebot/storybook/editor-story';
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

export const PickSetsSelector: StoryObj = {
  ...editor({ inspecting: true }),
  name: 'picking an element sets the selector and leaves inspecting',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await hoverPage(canvas.getByRole('heading', { level: 1 }));
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

export const HintsOtherMatches: StoryObj = {
  ...editor({ inspecting: true }),
  name: "hovering an element tints the selector's other matches on the page",
  play: async ({ canvasElement }) => {
    const [first, second] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.article-body')
    );

    await hoverPage(first);
    await waitFor(() => expect(currentChip()).toMatch(/article-body$/));

    const rects = document.querySelectorAll(
      '#stylebot-overlay .stylebot-overlay-rect'
    );
    const hints = document.querySelectorAll<HTMLElement>(
      '#stylebot-overlay .stylebot-overlay-hint'
    );
    await expect(rects).toHaveLength(1);
    await expect(hints).toHaveLength(1);
    await expect(hints[0].style.top).toBe(
      `${second.getBoundingClientRect().top}px`
    );

    await hoverPage(canvasElement.querySelector('h1') as HTMLElement);
    await waitFor(() =>
      expect(
        document.querySelectorAll('#stylebot-overlay .stylebot-overlay-hint')
      ).toHaveLength(0)
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
      await hoverPage(link);
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

      // The pointer is still over the link from before; leave and re-enter.
      await user.unhover(link);
      await hoverPage(link);
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

    await hoverPage(frame);
    await waitFor(() => expect(currentChip()).toMatch(/iframe/));

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
