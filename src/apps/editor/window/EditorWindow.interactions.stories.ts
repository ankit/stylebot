import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheStylebotApp from '@/apps/editor/components/TheStylebotApp.vue';
import { getPageBridge } from '@stylebot/page-bridge';
import {
  editor,
  editorWindow,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
import {
  openEditorMenu,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Window',
  tags: ['test'],
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

const panel = (root: HTMLElement) => root.querySelector('.stylebot');
const status = (root: HTMLElement) => root.querySelector('.window-status');
const shortcutsView = (root: HTMLElement) =>
  root.querySelector('.keyboard-shortcuts-view');

const sentMessages = () => spyOn(chrome.runtime, 'sendMessage');

export const DockToWindowFromMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Open in separate window hides the panel and asks for the window',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Open in separate window' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('window');
    await expect(store.state.visible).toBe(false);
    await waitFor(() => expect(panel(canvasElement)).toBeNull());
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'OpenEditorWindow' })
    );
  },
};

export const DockToWindowShortcut: StoryObj = {
  ...editor(WITH_RULE),
  name: 'w moves the editor to its window',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const sendMessage = sentMessages();

    await pressKey('w');

    await expect(store.state.options.layout.dockLocation).toBe('window');
    await expect(store.state.visible).toBe(false);
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'OpenEditorWindow' })
    );
  },
};

export const DockToSidePanelFromWindow: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'in the window, Open in side panel opens it for the tab, then closes the window',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Open in side panel' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('sidepanel');
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'OpenEditorSidePanel',
        tabId: store.state.tabId,
      })
    );
    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CloseEditorWindow' })
      )
    );
  },
};

export const DockBackFromWindow: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'in the window, docking left hands the editor back to the page',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const openInPage = spyOn(getPageBridge(), 'openInPage');

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Dock left in page' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('left');
    await expect(openInPage).toHaveBeenCalledTimes(1);
    await expect(openInPage).toHaveBeenCalledWith('left');
  },
};

export const NoCloseInWindow: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'the window leaves closing to its own title bar',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Close' })).toBeNull();
  },
};

export const EscapeBacksOutInWindow: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'Escape stops inspecting but leaves the window open',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const sendMessage = sentMessages();

    store.commit('setInspecting', true);
    await pressKey('Escape');
    await expect(store.state.inspecting).toBe(false);

    await pressKey('Escape');
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CloseEditorWindow' })
    );
  },
};

export const PageOnlyShortcutsIgnored: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'the push-page-aside shortcut does nothing in the window',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('a');
    await expect(store.state.options.layout.adjustPageLayout).toBe(false);
  },
};

export const ShortcutsViewInWindow: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'the shortcuts view lists the window shortcut and omits page-only ones',
  play: async ({ canvasElement }) => {
    await pressKey('?');
    await waitFor(() => expect(shortcutsView(canvasElement)).toBeVisible());

    const view = within(shortcutsView(canvasElement) as HTMLElement);
    await expect(view.getByText('Window')).toBeInTheDocument();
    await expect(view.queryByText('Push the page aside')).toBeNull();
  },
};

export const WaitingForPage: StoryObj = {
  ...editorWindow(WITH_RULE),
  name: 'losing the page shows the waiting card and inerts the editor until it is back',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await expect(status(canvasElement)).toBeNull();

    store.commit('setPageConnected', false);
    await waitFor(() =>
      expect(status(canvasElement)).toHaveTextContent('Waiting for the page…')
    );
    await expect(canvasElement.querySelector('.stylebot-body')).toHaveStyle({
      pointerEvents: 'none',
    });

    store.commit('setPageConnected', true);
    await waitFor(() => expect(status(canvasElement)).toBeNull());
  },
};
