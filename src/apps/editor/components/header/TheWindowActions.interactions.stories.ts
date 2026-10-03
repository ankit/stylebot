import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheWindowActions from './TheWindowActions.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import {
  openEditorMenu,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Window actions',
  tags: ['test'],
  component: TheWindowActions,
  parameters: { padded: false },
};

export default meta;

const panel = (root: HTMLElement) => root.querySelector('.stylebot');
const content = (root: HTMLElement) => root.querySelector('.stylebot-content');
const shortcutsView = (root: HTMLElement) =>
  root.querySelector('.keyboard-shortcuts-view');

export const DockFromOptionsMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Open in side panel asks for the side panel, then hides the panel',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Open in side panel' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('sidepanel');
    await waitFor(() => expect(store.state.visible).toBe(false));
    await waitFor(() => expect(panel(canvasElement)).toBeNull());
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'OpenEditorSidePanel' })
    );
  },
};

export const SidePanelShortcut: StoryObj = {
  ...editor(WITH_RULE),
  name: 's moves the editor to the side panel',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');

    await pressKey('s');
    await expect(store.state.options.layout.dockLocation).toBe('sidepanel');
    await waitFor(() => expect(store.state.visible).toBe(false));
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'OpenEditorSidePanel' })
    );
  },
};

export const DockInPageFromOptionsMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: 'docks the panel left or right in the page from the Options menu',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await expect(panel(canvasElement)).toHaveClass('right');

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Dock left in page' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('left');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('left'));
    await expect(canvas.queryByRole('menu')).toBeNull();

    await openEditorMenu(canvas, 'Options');
    await user.click(
      canvas.getByRole('button', { name: 'Dock right in page' })
    );
    await expect(store.state.options.layout.dockLocation).toBe('right');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('right'));
  },
};

export const DockShortcuts: StoryObj = {
  ...editor(WITH_RULE),
  name: 'l and r dock the panel left and right in the page',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('l');
    await expect(store.state.options.layout.dockLocation).toBe('left');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('left'));

    await pressKey('r');
    await expect(store.state.options.layout.dockLocation).toBe('right');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('right'));
  },
};

/* Pushing the page aside writes to document.body, which every story shares,
   so this one has to leave it the way it found it. */
export const AdjustPageLayout: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a pushes the page aside, reserving room in the body, and toggles it back',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('a');
    await expect(store.state.options.layout.adjustPageLayout).toBe(true);
    await waitFor(() =>
      expect(document.body.style.width).toMatch(/^calc\(100% - \d+px\)$/)
    );

    await pressKey('a');
    await expect(store.state.options.layout.adjustPageLayout).toBe(false);
    await waitFor(() => expect(document.body.style.width).toBe(''));
  },
};

export const AppearanceMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: "the Options menu's Theme row switches the panel between light, dark and system",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const app = canvasElement.querySelector('.stylebot-app') as HTMLElement;

    const menu = await openEditorMenu(canvas, 'Options');

    for (const [item, appearance] of [
      ['Dark', 'dark'],
      ['Light', 'light'],
      ['System', 'system'],
    ] as const) {
      await user.click(within(menu).getByRole('button', { name: item }));

      await expect(store.state.options.appearance).toBe(appearance);
      // System follows the OS, so the provider sets no theme of its own.
      await waitFor(() =>
        appearance === 'system'
          ? expect(app).not.toHaveAttribute('data-theme')
          : expect(app).toHaveAttribute('data-theme', appearance)
      );
    }
  },
};

export const CloseButton: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the close button closes the editor',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(canvas.getByRole('button', { name: 'Close' }));

    await expect(store.state.visible).toBe(false);
    await waitFor(() => expect(content(canvasElement)).toBeNull());
  },
};

export const EscapeClosesEditor: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Escape closes the editor',
  play: async ({ canvasElement }) => {
    await pressKey('Escape');
    await waitFor(() => expect(content(canvasElement)).toBeNull());
  },
};

export const EscapeClosesMenuBeforeEditor: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Escape closes an open header menu before the editor',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openEditorMenu(canvas, 'Options');

    await pressKey('Escape');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(content(canvasElement)).toBeInTheDocument();

    await pressKey('Escape');
    await waitFor(() => expect(content(canvasElement)).toBeNull());
  },
};

export const ShortcutsViewViaShortcut: StoryObj = {
  ...editor(WITH_RULE),
  name: '? opens the shortcuts view and stops inspecting; Escape closes only the view',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('i');
    await expect(store.state.inspecting).toBe(true);

    await pressKey('?');
    await waitFor(() => expect(shortcutsView(canvasElement)).toBeVisible());
    await expect(store.state.inspecting).toBe(false);

    await pressKey('Escape');
    await waitFor(() => expect(shortcutsView(canvasElement)).toBeNull());
    await expect(content(canvasElement)).toBeInTheDocument();
  },
};

export const ShortcutsViewViaMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the Options menu opens the shortcuts view and its back button dismisses it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('menuitem', { name: /Keyboard shortcuts/ })
    );
    await waitFor(() => expect(shortcutsView(canvasElement)).toBeVisible());

    await user.click(
      within(shortcutsView(canvasElement) as HTMLElement).getByRole('button', {
        name: 'Back',
      })
    );
    await waitFor(() => expect(shortcutsView(canvasElement)).toBeNull());
  },
};
