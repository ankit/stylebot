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
