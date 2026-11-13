import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import TheSelectorScopes from './TheSelectorScopes.vue';
import { editor } from '@stylebot/storybook/fixtures/editor';
import {
  hoverPage,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Scope pills',
  tags: ['test'],
  component: TheSelectorScopes,
  parameters: { padded: false },
};

export default meta;

const SCOPES_PAGE = `
  <div class="sb-page">
    <ul class="links">
      <li><a id="home" href="#">Home</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </div>
`;

const scopes = (root: HTMLElement) =>
  root.querySelector('.selector-scopes') as HTMLElement | null;
const pills = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('.selector-scopes .segment'));
const pill = (root: HTMLElement, label: string) =>
  pills(root).find(segment =>
    segment.querySelector('.segment-label')?.textContent?.includes(label)
  ) as HTMLElement;
const input = (root: HTMLElement) =>
  root.querySelector(
    '.selector-autocomplete .autocomplete-input'
  ) as HTMLTextAreaElement;
const chips = (root: HTMLElement) =>
  root.querySelector(
    '.selector-autocomplete .autocomplete-chips'
  ) as HTMLElement;

/**
 * Picks the Home link, then waits for its Only and All pills.
 */
const pickHome = async (root: HTMLElement): Promise<void> => {
  const home = within(root).getByRole('link', { name: 'Home' });

  await hoverPage(home);
  await pressKey('Enter');
  await waitFor(() => expect(pills(root)).toHaveLength(2));
};

export const PillsAfterPick: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking an element offers Only and All with their match counts',
  play: async ({ canvasElement }) => {
    await pickHome(canvasElement);

    const group = within(canvasElement).getByRole('group', {
      name: 'How much to style',
    });
    await expect(group).toHaveClass('segmented');
    await expect(pill(canvasElement, 'Only')).toHaveTextContent(/Only\s*1/);
    await expect(pill(canvasElement, 'All')).toHaveTextContent(/All\s*3/);

    // Hovering a pill previews its matches; leaving the row clears them.
    // user-event fires mouseleave only on the pill, not its row as a browser would.
    const hints = () =>
      document.querySelectorAll('#stylebot-overlay .stylebot-overlay-hint');
    await user.hover(pill(canvasElement, 'All'));
    await waitFor(() => expect(hints()).toHaveLength(3));
    await user.hover(within(canvasElement).getByRole('link', { name: 'Home' }));
    await fireEvent.mouseLeave(scopes(canvasElement) as HTMLElement);
    await waitFor(() => expect(hints()).toHaveLength(0));
  },
};

export const ClickingAllSetsField: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'clicking All puts its selector in the field',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await user.click(pill(canvasElement, 'All'));
    const selector = store.state.activeSelector;
    await expect(document.querySelectorAll(selector)).toHaveLength(3);
    await waitFor(() =>
      expect(pill(canvasElement, 'All')).toHaveAttribute('aria-pressed', 'true')
    );
  },
};

export const TypingHidesRow: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'typing a selector of your own hides the pills',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await user.click(chips(canvasElement));
    await waitFor(() => expect(input(canvasElement)).toHaveFocus());
    await user.clear(input(canvasElement));
    await user.type(input(canvasElement), 'ul');

    await expect(store.state.activeSelector).toBe('ul');
    await waitFor(() => expect(scopes(canvasElement)).toBeNull());
  },
};
