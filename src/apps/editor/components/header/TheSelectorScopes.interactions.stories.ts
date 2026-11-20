import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import TheSelectorScopes from './TheSelectorScopes.vue';
import { isPeeking } from '../../utils/selector-peek';
import { editor } from '@stylebot/storybook/fixtures/editor';
import {
  findOpenMenu,
  hoverPage,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Scope menu',
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

const ONE_SCOPE_PAGE = `
  <div class="sb-page">
    <p class="lede">Only one of these.</p>
  </div>
`;

const scopes = (root: HTMLElement) =>
  root.querySelector('.selector-scopes') as HTMLElement | null;
const trigger = (root: HTMLElement) =>
  root.querySelector('.selector-scopes .scope-trigger') as HTMLElement;
const boxes = () =>
  document.querySelectorAll('#stylebot-overlay .stylebot-overlay-rect');
const input = (root: HTMLElement) =>
  root.querySelector(
    '.selector-autocomplete .autocomplete-input'
  ) as HTMLTextAreaElement;
const chips = (root: HTMLElement) =>
  root.querySelector(
    '.selector-autocomplete .autocomplete-chips'
  ) as HTMLElement;

/**
 * Picks the Home link, then waits for the scope menu's button.
 */
const pickHome = async (root: HTMLElement): Promise<void> => {
  const home = within(root).getByRole('link', { name: 'Home' });

  await hoverPage(home);
  await pressKey('Enter');
  await waitFor(() =>
    expect(root.querySelector('button.scope-trigger')).not.toBeNull()
  );
};

/**
 * Opens the scope menu and resolves with it.
 */
const openScopes = async (root: HTMLElement): Promise<HTMLElement> => {
  await user.click(trigger(root));
  return findOpenMenu(within(root));
};

const scopeItem = (menu: HTMLElement, label: string) =>
  within(menu).getByRole('menuitem', { name: new RegExp(`^${label}`) });

/**
 * Picks a scope from the menu by its label.
 */
const pickScope = async (root: HTMLElement, label: string): Promise<void> => {
  await user.click(scopeItem(await openScopes(root), label));
  await waitFor(() => expect(within(root).queryByRole('menu')).toBeNull());
};

export const MenuAfterPick: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking an element offers Only, Similar and All with their match counts in a menu',
  play: async ({ canvasElement }) => {
    await pickHome(canvasElement);

    const menu = await openScopes(canvasElement);
    await expect(menu).toHaveAccessibleName('How much to style');
    await expect(scopeItem(menu, 'Only')).toHaveTextContent(/Only\s*1/);
    await expect(scopeItem(menu, 'Similar')).toHaveTextContent(/Similar\s*3/);
    await expect(scopeItem(menu, 'All')).toHaveTextContent(/All\s*6/);

    // Hovering a scope previews its matches; leaving the menu clears them.
    await user.hover(scopeItem(menu, 'All'));
    await waitFor(() => expect(boxes()).toHaveLength(6));
    await fireEvent.mouseLeave(menu);
    await waitFor(() => expect(boxes()).toHaveLength(0));
  },
};

export const PickStartsOnSimilar: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking an element starts on Similar, shown on the menu button and checked in the menu',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await waitFor(() =>
      expect(trigger(canvasElement)).toHaveTextContent(/Similar\s*3/)
    );

    const selector = store.state.activeSelector;
    const titles = Array.from(document.querySelectorAll('li.item > a'));
    await expect(Array.from(document.querySelectorAll(selector))).toEqual(
      titles
    );
    await waitFor(() =>
      expect(chips(canvasElement)).toHaveTextContent(selector)
    );

    const menu = await openScopes(canvasElement);
    await expect(scopeItem(menu, 'Similar')).toHaveClass('selected');
    await expect(scopeItem(menu, 'All')).not.toHaveClass('selected');
  },
};

export const ClickingAllSetsField: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking All puts its selector in the field and closes the menu',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await pickScope(canvasElement, 'All');

    const selector = store.state.activeSelector;
    await expect(document.querySelectorAll(selector)).toHaveLength(6);
    await waitFor(() =>
      expect(trigger(canvasElement)).toHaveTextContent(/All\s*6/)
    );
  },
};

export const MenuInCodeMode: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'in Code mode, the scope menu stays and picking one switches the rule',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await pressKey('c');
    await waitFor(() => expect(store.state.options.mode).toBe('code'));

    await pickScope(canvasElement, 'All');
    const selector = store.state.activeSelector;
    await expect(document.querySelectorAll(selector)).toHaveLength(6);
  },
};

export const PickingPeeksAtMatches: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking an element boxes what its scope matches for a moment',
  play: async ({ canvasElement }) => {
    const picked = Date.now();
    await pickHome(canvasElement);
    await waitFor(() => expect(boxes()).not.toHaveLength(0));
    await expect(isPeeking()).toBe(true);

    await waitFor(() => expect(boxes()).toHaveLength(0), { timeout: 2000 });
    await expect(Date.now() - picked).toBeGreaterThanOrEqual(700);
  },
};

export const PickingScopeDoesNotPeek: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking a scope from the menu drops its hover preview without a timed peek',
  play: async ({ canvasElement }) => {
    await pickHome(canvasElement);
    await waitFor(() => expect(isPeeking()).toBe(false), { timeout: 2000 });

    const menu = await openScopes(canvasElement);
    await user.hover(scopeItem(menu, 'All'));
    await waitFor(() => expect(boxes()).toHaveLength(6));

    await user.click(scopeItem(menu, 'All'));
    await waitFor(() => expect(boxes()).toHaveLength(0));
    await expect(isPeeking()).toBe(false);
  },
};

export const ClickingSimilarSetsField: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'picking Similar puts the same spot in every block in the field',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await pickScope(canvasElement, 'Only');
    await pickScope(canvasElement, 'Similar');

    const selector = store.state.activeSelector;
    const titles = Array.from(document.querySelectorAll('li.item > a'));
    await expect(Array.from(document.querySelectorAll(selector))).toEqual(
      titles
    );
  },
};

export const SavedRuleFillsSimilar: StoryObj = {
  ...editor(
    { inspecting: true, css: '.item > a { color: red; }' },
    { page: SCOPES_PAGE }
  ),
  name: 'a saved rule that reaches what Similar would fills Similar, and the field starts on it',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pickHome(canvasElement);
    await waitFor(() =>
      expect(trigger(canvasElement)).toHaveTextContent(/Similar\s*3/)
    );
    await expect(store.state.activeSelector).toBe('.item > a');

    await pickScope(canvasElement, 'Only');
    await expect(store.state.activeSelector).not.toBe('.item > a');
    await pickScope(canvasElement, 'Similar');
    await expect(store.state.activeSelector).toBe('.item > a');
  },
};

export const OneScopeIsALabel: StoryObj = {
  ...editor({ inspecting: true }, { page: ONE_SCOPE_PAGE }),
  name: 'with only one scope, its count shows as a label instead of a menu',
  play: async ({ canvasElement }) => {
    const lede = within(canvasElement).getByText('Only one of these.');

    await hoverPage(lede);
    await pressKey('Enter');
    await waitFor(() =>
      expect(scopes(canvasElement)).toHaveTextContent('1 element')
    );
    await expect(
      canvasElement.querySelector('button.scope-trigger')
    ).toBeNull();
  },
};

export const TypingHidesScopes: StoryObj = {
  ...editor({ inspecting: true }, { page: SCOPES_PAGE }),
  name: 'typing a selector of your own hides the scope menu',
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
