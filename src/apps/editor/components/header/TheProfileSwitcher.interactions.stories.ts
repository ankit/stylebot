import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheProfileSwitcher from './TheProfileSwitcher.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import { findOpenMenu, storeOf, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Profiles',
  tags: ['test'],
  component: TheProfileSwitcher,
  parameters: { padded: false },
};

export default meta;

const WITH_PROFILES = {
  ...WITH_RULE,
  profiles: [
    { id: 'default', name: '' },
    { id: 'dark', name: 'Dark' },
  ],
  activeProfile: 'default',
};

type Canvas = ReturnType<typeof within>;

const sentMessages = () => spyOn(chrome.runtime, 'sendMessage');

const trigger = (canvas: Canvas) =>
  canvas.getByRole('button', { name: 'Switch profile' });

const openSwitcher = async (canvas: Canvas) => {
  await user.click(trigger(canvas));
  return findOpenMenu(canvas);
};

const row = (menu: HTMLElement, name: string) =>
  within(menu)
    .getByRole('menuitem', { name })
    .closest('.profile-row') as HTMLElement;

/**
 * Opens the ••• menu on a profile's row and resolves with its items.
 */
const openRowMenu = async (canvas: Canvas, menu: HTMLElement, name: string) => {
  const target = row(menu, name);

  await user.hover(target);
  await user.click(
    within(target).getByRole('button', { name: 'Profile actions' })
  );

  return waitFor(() => {
    const rowMenu = canvas.getAllByRole('menu')[1];
    expect(rowMenu).toBeVisible();
    return rowMenu;
  });
};

const nameField = (menu: HTMLElement) =>
  within(menu).getByRole('textbox', { name: 'Profile name' });

export const SwitchProfile: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'the header names the active profile, and picking another asks the background to switch to it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await expect(trigger(canvas)).toHaveTextContent('Default');

    const menu = await openSwitcher(canvas);
    await expect(
      within(menu).getByRole('menuitem', { name: 'Default' })
    ).toHaveAttribute('aria-current', 'true');
    await expect(
      within(menu).getByRole('menuitem', { name: 'Create profile' })
    ).toBeVisible();

    await user.click(within(menu).getByRole('menuitem', { name: 'Dark' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetActiveProfile',
        url: 'example.com',
        profileId: 'dark',
      })
    );
  },
};

export const MenuFitsLongSiteName: StoryObj = {
  ...editor({
    ...WITH_PROFILES,
    url: 'news.ycombinator.com',
    profiles: [{ id: 'default', name: 'Dracula' }],
  }),
  name: 'with a long site name the menu still opens inside the panel',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvasElement.querySelector('.header') as HTMLElement;

    const menu = await openSwitcher(canvas);

    await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
      header.getBoundingClientRect().right
    );
  },
};

export const SwitchResetsUndo: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'a switch pushed from elsewhere shows the new profile and clears undo',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('an edit leaves something to undo', async () => {
      await store.dispatch('applyCss', { css: 'h1 { color: red; }' });
      await expect(store.state.undoStack.past).toHaveLength(1);
    });

    await step('the switch lands and the trail is gone', async () => {
      await store.dispatch('syncFromPage', {
        activeProfile: 'dark',
        css: 'h1 { color: white; }',
      });

      await expect(store.state.undoStack.past).toHaveLength(0);
      await waitFor(() => expect(trigger(canvas)).toHaveTextContent('Dark'));
    });
  },
};

export const EditsGoToActiveProfile: StoryObj = {
  ...editor({ ...WITH_PROFILES, activeProfile: 'dark' }),
  name: 'an edit is saved to the profile the editor shows',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const sendMessage = sentMessages();

    await store.dispatch('applyCss', { css: 'h1 { color: white; }' });

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SetStyle', profileId: 'dark' })
    );
  },
};

export const CreateProfile: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Create profile names the new profile in place, starting from Untitled, and refuses a taken name',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    await user.click(
      within(menu).getByRole('menuitem', { name: 'Create profile' })
    );

    const field = nameField(menu);

    await step('the field starts as Untitled, ready to type over', async () => {
      await waitFor(() => expect(field).toHaveFocus());
      await expect(field).toHaveValue('Untitled');
    });

    await step('a taken name is refused', async () => {
      await user.clear(field);
      await user.type(field, 'dark{Enter}');

      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CreateProfile' })
      );
    });

    await step('a free name creates a blank profile', async () => {
      await user.clear(field);
      await user.type(field, 'Print{Enter}');

      await expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CreateProfile',
          url: 'example.com',
          profileName: 'Print',
          sourceProfileId: undefined,
          activate: true,
        })
      );
      await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    });
  },
};

export const CreateEscape: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Escape backs out of naming a profile and leaves the menu open',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    await user.click(
      within(menu).getByRole('menuitem', { name: 'Create profile' })
    );
    await waitFor(() => expect(nameField(menu)).toHaveFocus());

    await user.keyboard('{Escape}');

    await expect(
      within(menu).queryByRole('textbox', { name: 'Profile name' })
    ).toBeNull();
    await expect(menu).toBeVisible();
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CreateProfile' })
    );
  },
};

export const DuplicateProfile: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Duplicate on a row copies that profile, named after it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    const rowMenu = await openRowMenu(canvas, menu, 'Dark');
    await user.click(
      within(rowMenu).getByRole('menuitem', { name: 'Duplicate' })
    );

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CreateProfile',
        profileName: 'Dark copy',
        sourceProfileId: 'dark',
      })
    );
  },
};

export const RenameProfile: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Rename on a row edits that name in place, and Enter saves it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    const rowMenu = await openRowMenu(canvas, menu, 'Dark');
    await user.click(within(rowMenu).getByRole('menuitem', { name: 'Rename' }));

    const field = nameField(menu);
    await waitFor(() => expect(field).toHaveFocus());
    await expect(field).toHaveValue('Dark');

    await user.clear(field);
    await user.type(field, 'Night{Enter}');

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RenameProfile',
        profileId: 'dark',
        profileName: 'Night',
      })
    );
    await expect(menu).toBeVisible();
  },
};

export const RenameEscape: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Escape cancels a rename without saving it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    const rowMenu = await openRowMenu(canvas, menu, 'Dark');
    await user.click(within(rowMenu).getByRole('menuitem', { name: 'Rename' }));

    const field = nameField(menu);
    await waitFor(() => expect(field).toHaveFocus());
    await user.type(field, ' theme');
    await user.keyboard('{Escape}');

    await expect(
      within(menu).getByRole('menuitem', { name: 'Dark' })
    ).toBeVisible();
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'RenameProfile' })
    );
  },
};

export const DeleteProfile: StoryObj = {
  ...editor(WITH_PROFILES),
  name: 'Delete on a row asks first, inside the panel, then deletes that profile',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const menu = await openSwitcher(canvas);
    const rowMenu = await openRowMenu(canvas, menu, 'Dark');
    await user.click(within(rowMenu).getByRole('menuitem', { name: 'Delete' }));

    const dialog = await canvas.findByRole('alertdialog');
    await expect(dialog).toHaveTextContent('the Dark profile');

    const panel = canvasElement.querySelector('.stylebot') as HTMLElement;
    const backdrop = dialog.parentElement as HTMLElement;
    await expect(backdrop.getBoundingClientRect().width).toBe(
      panel.clientWidth
    );

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'DeleteProfile', profileId: 'dark' })
    );
  },
};

export const LastProfileCannotBeDeleted: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a style with one profile offers no delete',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(trigger(canvas)).toHaveTextContent('Default');
    const menu = await openSwitcher(canvas);
    const rowMenu = await openRowMenu(canvas, menu, 'Default');

    await expect(
      within(rowMenu).getByRole('menuitem', { name: 'Rename' })
    ).toBeVisible();
    await expect(
      within(rowMenu).queryByRole('menuitem', { name: 'Delete' })
    ).toBeNull();
  },
};
