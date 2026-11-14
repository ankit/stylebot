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
      <li class="item"><a id="home" href="#">Home</a> <span><a href="#">edit</a></span></li>
      <li class="item"><a href="#">About</a> <span><a href="#">edit</a></span></li>
      <li class="item"><a href="#">Contact</a> <span><a href="#">edit</a></span></li>
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
 * Picks the Home link, then waits for its Only, Similar and All pills.
 */
const pickHome = async (root: HTMLElement): Promise<void> => {
  const home = within(root).getByRole('link', { name: 'Home' });

  await hoverPage(home);
  await pressKey('Enter');
  await waitFor(() => expect(pills(root)).toHaveLength(3));
};

export const PillsAfterPick: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking an element offers Only, Similar and All with their match counts',
  play: async ({ canvasElement }) => {
    await pickHome(canvasElement);

    const group = within(canvasElement).getByRole('group', {
      name: 'How much to style',
    });
    await expect(group).toHaveClass('segmented');
    await expect(pill(canvasElement, 'Only')).toHaveTextContent(/Only\s*1/);
    await expect(pill(canvasElement, 'Similar')).toHaveTextContent(
      /Similar\s*3/
    );
    await expect(pill(canvasElement, 'All')).toHaveTextContent(/All\s*6/);

    // Hovering a pill previews its matches; leaving the row clears them.
    // user-event fires mouseleave only on the pill, not its row as a browser would.
    const boxes = () =>
      document.querySelectorAll('#stylebot-overlay .stylebot-overlay-rect');
    await user.hover(pill(canvasElement, 'All'));
    await waitFor(() => expect(boxes()).toHaveLength(6));
    await user.hover(within(canvasElement).getByRole('link', { name: 'Home' }));
    await fireEvent.mouseLeave(scopes(canvasElement) as HTMLElement);
    await waitFor(() => expect(boxes()).toHaveLength(0));
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
    await expect(document.querySelectorAll(selector)).toHaveLength(6);
    await waitFor(() =>
      expect(pill(canvasElement, 'All')).toHaveAttribute('aria-pressed', 'true')
    );
  },
};

export const ClickingSimilarSetsField: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'clicking Similar puts the same spot in every block in the field',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await user.click(pill(canvasElement, 'Similar'));
    const selector = store.state.activeSelector;
    const titles = Array.from(document.querySelectorAll('li.item > a'));
    await expect(Array.from(document.querySelectorAll(selector))).toEqual(
      titles
    );
    await waitFor(() =>
      expect(pill(canvasElement, 'Similar')).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
  },
};

export const StyledPillForSavedRule: StoryObj = {
  ...editor(
    { inspecting: true, css: '.item > a { color: red; }' },
    { page: SCOPES_PAGE }
  ),
  name: 'a saved rule for the element shows as Styled, in place of a suggestion that reaches the same elements',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const home = within(canvasElement).getByRole('link', { name: 'Home' });

    await hoverPage(home);
    await pressKey('Enter');
    await waitFor(() => expect(pills(canvasElement)).toHaveLength(3));

    await expect(pills(canvasElement).at(-1)).toHaveTextContent(/Styled\s*3/);
    const others = pills(canvasElement).slice(0, -1);
    await expect(others.map(other => other.textContent)).not.toContainEqual(
      expect.stringMatching(/\b3\b/)
    );
    await expect(store.state.activeSelector).not.toBe('.item > a');

    await user.click(pill(canvasElement, 'Styled'));
    await expect(store.state.activeSelector).toBe('.item > a');
    await waitFor(() =>
      expect(pill(canvasElement, 'Styled')).toHaveAttribute(
        'aria-pressed',
        'true'
      )
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
