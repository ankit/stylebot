import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheWindowActions from './TheWindowActions.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
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

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

const panel = (root: HTMLElement) => root.querySelector('.stylebot');
const content = (root: HTMLElement) => root.querySelector('.stylebot-content');
const helpDialog = (root: HTMLElement) =>
  root.querySelector('.stylebot-help-dialog');

export const DockFromOptionsMenu: StoryObj = {
  ...editor(withRule),
  name: 'docks the panel left or right from the Options menu',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await expect(panel(canvasElement)).toHaveClass('right');

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('button', { name: 'Dock to Left' })
    );

    await expect(store.state.options.layout.dockLocation).toBe('left');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('left'));
    await expect(canvas.queryByRole('menu')).toBeNull();

    await openEditorMenu(canvas, 'Options');
    await user.click(canvas.getByRole('button', { name: 'Dock to Right' }));
    await expect(store.state.options.layout.dockLocation).toBe('right');
    await waitFor(() => expect(panel(canvasElement)).toHaveClass('right'));
  },
};

export const DockShortcuts: StoryObj = {
  ...editor(withRule),
  name: 'l and r dock the panel left and right',
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
  ...editor(withRule),
  name: 'pushing the page aside reserves room in the body and p toggles it back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(within(menu).getByRole('checkbox'));

    await expect(store.state.options.layout.adjustPageLayout).toBe(true);
    await waitFor(() =>
      expect(document.body.style.width).toMatch(/^calc\(100% - \d+px\)$/)
    );

    await pressKey('Escape');
    await expect(canvas.queryByRole('menu')).toBeNull();

    await pressKey('p');
    await expect(store.state.options.layout.adjustPageLayout).toBe(false);
    await waitFor(() => expect(document.body.style.width).toBe(''));
  },
};

export const AppearanceMenu: StoryObj = {
  ...editor(withRule),
  name: 'the appearance menu switches the panel between light, dark and system',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const app = canvasElement.querySelector('.stylebot-app') as HTMLElement;

    await user.click(
      within(await openEditorMenu(canvas, 'Panel appearance')).getByRole(
        'menuitem',
        { name: 'Dark' }
      )
    );
    await expect(store.state.options.appearance).toBe('dark');
    await waitFor(() => expect(app).toHaveAttribute('data-theme', 'dark'));

    await user.click(
      within(await openEditorMenu(canvas, 'Panel appearance')).getByRole(
        'menuitem',
        { name: 'Light' }
      )
    );
    await expect(store.state.options.appearance).toBe('light');
    await waitFor(() => expect(app).toHaveAttribute('data-theme', 'light'));

    await user.click(
      within(await openEditorMenu(canvas, 'Panel appearance')).getByRole(
        'menuitem',
        { name: 'System' }
      )
    );
    await expect(store.state.options.appearance).toBe('system');
    await waitFor(() => expect(app).not.toHaveAttribute('data-theme'));
  },
};

export const CloseButton: StoryObj = {
  ...editor(withRule),
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
  ...editor(withRule),
  name: 'Escape closes the editor',
  play: async ({ canvasElement }) => {
    await pressKey('Escape');
    await waitFor(() => expect(content(canvasElement)).toBeNull());
  },
};

export const EscapeClosesMenuBeforeEditor: StoryObj = {
  ...editor(withRule),
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

export const HelpDialogViaShortcut: StoryObj = {
  ...editor(withRule),
  name: '? opens the shortcuts dialog and stops inspecting; Escape closes only the dialog',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('i');
    await expect(store.state.inspecting).toBe(true);

    await pressKey('?');
    await waitFor(() => expect(helpDialog(canvasElement)).toBeVisible());
    await expect(store.state.inspecting).toBe(false);

    await pressKey('Escape');
    await waitFor(() => expect(helpDialog(canvasElement)).toBeNull());
    await expect(content(canvasElement)).toBeInTheDocument();
  },
};

export const HelpDialogViaMenu: StoryObj = {
  ...editor(withRule),
  name: 'the Options menu opens the shortcuts dialog and its close button dismisses it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const menu = await openEditorMenu(canvas, 'Options');
    await user.click(
      within(menu).getByRole('menuitem', { name: /View keyboard shortcuts/ })
    );
    await waitFor(() => expect(helpDialog(canvasElement)).toBeVisible());

    await user.click(
      within(helpDialog(canvasElement) as HTMLElement).getByRole('button', {
        name: 'Close',
      })
    );
    await waitFor(() => expect(helpDialog(canvasElement)).toBeNull());
  },
};
