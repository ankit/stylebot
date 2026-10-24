import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import SiteProfiles from './SiteProfiles.vue';
import {
  popup,
  profiledStyle,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Profiles',
  tags: ['test'],
  component: SiteProfiles,
  parameters: { padded: false },
};

export default meta;

const twoProfiles = popup({
  styles: [profiledStyle('example.com')],
  defaultStyle: profiledStyle('example.com'),
});

const sentMessages = () => spyOn(chrome.runtime, 'sendMessage');

/**
 * Watches the page messages that open the editor, keeping the popup open.
 */
const editorToggles = () => {
  spyOn(window, 'close').mockImplementation(() => undefined);
  return spyOn(chrome.tabs, 'sendMessage');
};

export const ListsProfiles: StoryObj = {
  ...twoProfiles,
  name: 'a site with several profiles lists them after No style, checks the one that is on, and edits it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('radio', { name: 'Default' })
    ).toBeChecked();
    await expect(
      canvas.getAllByRole('radio').map(radio => radio.textContent?.trim())
    ).toEqual(['No style', 'Default', 'Dark']);
    await expect(canvas.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
    await expect(
      canvas.getByRole('radio', { name: 'No style' })
    ).not.toBeChecked();
    await expect(
      canvas.getByRole('button', { name: /^Edit Default/ })
    ).toBeVisible();
  },
};

export const PickProfile: StoryObj = {
  ...twoProfiles,
  name: 'picking a profile switches the site to it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await user.click(await canvas.findByRole('radio', { name: 'Dark' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetActiveProfile',
        url: 'example.com',
        profileId: 'dark',
      })
    );
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'DisableStyle' })
    );
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(
      canvas.getByRole('button', { name: /^Edit Dark/ })
    ).toBeVisible();
  },
};

export const NoStyle: StoryObj = {
  ...twoProfiles,
  name: 'No style turns the site off, and picking a profile turns it back on',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await step('No style disables the site', async () => {
      await user.click(await canvas.findByRole('radio', { name: 'No style' }));

      await expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'DisableStyle', url: 'example.com' })
      );
      await expect(
        canvas.getByRole('radio', { name: 'No style' })
      ).toBeChecked();
    });

    await step('the profile that was on comes back on', async () => {
      sendMessage.mockClear();
      await user.click(canvas.getByRole('radio', { name: 'Default' }));

      await expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'EnableStyle', url: 'example.com' })
      );
      await expect(sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SetActiveProfile' })
      );
      await expect(
        canvas.getByRole('radio', { name: 'Default' })
      ).toBeChecked();
    });
  },
};

export const OffWhileEditing: StoryObj = {
  ...popup({
    styles: [profiledStyle('example.com')],
    defaultStyle: profiledStyle('example.com'),
    isOpen: true,
  }),
  name: 'while the editor is open, profiles still switch but No style waits',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() =>
      expect(canvas.getByRole('radio', { name: 'No style' })).toBeDisabled()
    );
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeEnabled();
  },
};

export const SingleProfile: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
  }),
  name: 'a site with one profile keeps the plain toggle',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('example.com');
    await expect(canvas.queryByRole('radio')).toBeNull();
    await expect(
      canvas.getByRole('button', { name: /^Style this page/ })
    ).toBeVisible();
  },
};

export const CreateProfile: StoryObj = {
  ...twoProfiles,
  name: 'Create profile names a new profile below the list, applies it and opens the editor on it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();
    const tabMessages = editorToggles();

    await user.click(
      await canvas.findByRole('button', { name: 'Create profile' })
    );
    const field = canvas.getByRole('textbox', { name: 'Profile name' });

    await expect(field).toHaveFocus();
    await expect(field).toHaveValue('Untitled');

    await user.keyboard('Reading{Enter}');

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CreateProfile',
        url: 'example.com',
        profileName: 'Reading',
        activate: true,
      })
    );
    await expect(tabMessages).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ name: 'ToggleStylebot' })
    );
    await expect(
      await canvas.findByRole('radio', { name: 'Reading' })
    ).toBeChecked();
  },
};

export const CreateProfileWhileEditing: StoryObj = {
  ...popup({
    styles: [profiledStyle('example.com')],
    defaultStyle: profiledStyle('example.com'),
    isOpen: true,
  }),
  name: 'with the editor open, Create profile switches it to the new profile without closing it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabMessages = editorToggles();

    await waitFor(() =>
      expect(canvas.getByRole('radio', { name: 'No style' })).toBeDisabled()
    );
    await user.click(canvas.getByRole('button', { name: 'Create profile' }));
    await user.keyboard('{Enter}');

    await expect(
      await canvas.findByRole('radio', { name: 'Untitled' })
    ).toBeChecked();
    await expect(tabMessages).not.toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ name: 'ToggleStylebot' })
    );
  },
};

export const CreateProfileNameTaken: StoryObj = {
  ...twoProfiles,
  name: 'Create profile refuses a name another profile has, and Escape or clicking away cancels',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await user.click(
      await canvas.findByRole('button', { name: 'Create profile' })
    );
    await user.keyboard('dark{Enter}');

    await expect(
      canvas.getByRole('textbox', { name: 'Profile name' })
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CreateProfile' })
    );

    await step('Escape cancels', async () => {
      await user.keyboard('{Escape}');

      await expect(canvas.queryByRole('textbox')).toBeNull();
    });

    await step('clicking away cancels', async () => {
      await user.click(canvas.getByRole('button', { name: 'Create profile' }));
      await user.click(canvas.getByText('example.com'));

      await expect(canvas.queryByRole('textbox')).toBeNull();
      await expect(sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CreateProfile' })
      );
    });
  },
};

export const CreateSecondProfile: StoryObj = {
  ...popup({
    styles: [style('example.com', false)],
    defaultStyle: style('example.com', false),
  }),
  name: 'Create profile under a site’s one style turns it on and switches the popup to the profile list',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();
    editorToggles();

    await user.click(
      await canvas.findByRole('button', { name: 'Create profile' })
    );
    await user.keyboard('{Enter}');

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CreateProfile',
        profileName: 'Untitled',
      })
    );
    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'EnableStyle', url: 'example.com' })
    );
    await expect(
      await canvas.findByRole('radio', { name: 'Untitled' })
    ).toBeChecked();
    await expect(
      canvas.getAllByRole('radio').map(radio => radio.textContent?.trim())
    ).toEqual(['No style', 'Default', 'Untitled']);
  },
};

export const BlankActiveProfileStillListed: StoryObj = {
  ...popup({
    styles: [{ ...profiledStyle('example.com'), css: '' }],
    defaultStyle: { ...profiledStyle('example.com'), css: '' },
  }),
  name: 'a site whose active profile is blank is still listed, so it can be switched back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('radio', { name: 'Dark' })
    ).toBeVisible();
  },
};

export const OtherStyleProfiles: StoryObj = {
  ...popup({
    styles: [style('example.com'), profiledStyle('example.com/article')],
    defaultStyle: style('example.com'),
  }),
  name: 'another matching style with several profiles switches from its row without toggling',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await user.click(await canvas.findByRole('button', { name: 'Default' }));
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByRole('menuitem', { name: 'Dark' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetActiveProfile',
        url: 'example.com/article',
        profileId: 'dark',
      })
    );
    await expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'DisableStyle' })
    );
  },
};

export const SeveralStylesAsRows: StoryObj = {
  ...popup({
    styles: [
      profiledStyle('example.com/article'),
      profiledStyle('example.com'),
    ],
    defaultStyle: profiledStyle('example.com/article'),
  }),
  name: 'several matching styles are all rows, and Edit names the style it opens',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    await canvas.findByRole('button', { name: /^Edit example\.com\/article/ });
    await expect(canvas.queryByRole('radio')).toBeNull();

    const [own] = canvas.getAllByRole('button', { name: 'Default' });
    await user.click(own);
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByRole('menuitem', { name: 'Dark' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetActiveProfile',
        url: 'example.com/article',
        profileId: 'dark',
      })
    );
  },
};

export const BroaderStyleEditsInOptions: StoryObj = {
  ...popup({
    styles: [style('example.com/article'), profiledStyle('example.com')],
    defaultStyle: style('example.com/article'),
  }),
  name: 'a broader matching style opens in Options from its row',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = sentMessages();

    const [edit] = await canvas.findAllByRole('button', {
      name: 'Edit in Options',
    });
    await expect(
      canvas.getAllByRole('button', { name: 'Edit in Options' })
    ).toHaveLength(1);
    await user.click(edit);

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'OpenOptionsPage',
        route: '/styles/edit?url=example.com',
      })
    );
  },
};

/**
 * Opens a profile's ••• menu and returns it.
 */
const openProfileMenu = async (canvasElement: HTMLElement, name: string) => {
  const canvas = within(canvasElement);
  const row = (await canvas.findByRole('radio', { name })).parentElement!;

  await user.hover(row);
  await user.click(
    within(row).getByRole('button', { name: 'Profile actions' })
  );

  return within(row).findByRole('menu');
};

export const PublishProfile: StoryObj = {
  ...twoProfiles,
  name: "a profile's menu offers Publish to Gallery, which publishes it on the gallery site without opening the editor",
  play: async ({ canvasElement }) => {
    const sendMessage = sentMessages();
    const menu = await openProfileMenu(canvasElement, 'Dark');

    await user.click(
      await within(menu).findByRole('menuitem', { name: 'Publish to Gallery' })
    );

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PublishProfileToGallery',
        url: 'example.com',
        profileId: 'dark',
      })
    );
  },
};

export const PublishUpdate: StoryObj = {
  ...popup({
    styles: [profiledStyle('example.com')],
    defaultStyle: profiledStyle('example.com'),
    gallery: {
      published: {
        styleId: 1,
        version: 1,
        cssHash: 'stale',
        slug: 'dark',
      },
    },
  }),
  name: 'a published profile with changes offers to publish an update',
  play: async ({ canvasElement }) => {
    const menu = await openProfileMenu(canvasElement, 'Dark');

    await waitFor(() =>
      expect(
        within(menu).getByRole('menuitem', { name: 'Publish update' })
      ).toBeVisible()
    );
  },
};

export const InstalledProfile: StoryObj = {
  ...popup({
    styles: [profiledStyle('example.com')],
    defaultStyle: profiledStyle('example.com'),
    gallery: { installed: { id: 2, slug: 'dark', cssHash: 'abc' } },
  }),
  name: "a profile installed from someone else's Gallery style offers View in Gallery, which opens its page there",
  play: async ({ canvasElement }) => {
    const createTab = spyOn(chrome.tabs, 'create');
    const menu = await openProfileMenu(canvasElement, 'Dark');

    await expect(
      within(menu).queryByRole('menuitem', { name: /Publish/ })
    ).toBeNull();
    await user.click(
      await within(menu).findByRole('menuitem', { name: 'View in Gallery' })
    );

    await expect(createTab).toHaveBeenCalledWith({
      url: expect.stringMatching(/\/style\/2\/dark$/),
    });
  },
};
