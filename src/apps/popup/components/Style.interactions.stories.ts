import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import Style from './Style.vue';
import { popup, style } from '@stylebot/storybook/fixtures/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Styles',
  tags: ['test'],
  component: Style,
  parameters: { padded: false },
};

export default meta;

export const SavedStyle: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
  }),
  name: "the page's one style shows as a Style toggle, on, and Edit style opens it",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Style/ })
    ).toBeChecked();
    await expect(canvas.queryByRole('radio')).toBeNull();
    await expect(
      canvas.getByRole('button', { name: /^Edit style/ })
    ).toBeVisible();
  },
};

export const NamedStyle: StoryObj = {
  ...popup({
    styles: [
      {
        ...style('example.com'),
        profiles: { default: { name: 'Dracula' } },
        activeProfile: 'default',
      },
    ],
    defaultStyle: style('example.com'),
  }),
  name: 'a renamed style shows its name instead of Style',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Dracula/ })
    ).toBeChecked();
    await expect(
      canvas.getByRole('button', { name: /^Edit Dracula/ })
    ).toBeVisible();
  },
};

export const DisabledStyle: StoryObj = {
  ...popup({
    styles: [style('example.com', false)],
    defaultStyle: style('example.com', false),
  }),
  name: 'a turned-off style shows with its toggle off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Style/ })
    ).not.toBeChecked();
  },
};

const oneStyle = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
});

/**
 * Opens the style's ••• menu and returns it.
 */
const openStyleMenu = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const toggle = await canvas.findByRole('checkbox', { name: /^Style/ });

  await user.hover(toggle.closest('.popup-row') as HTMLElement);
  await user.click(canvas.getByRole('button', { name: 'Profile actions' }));

  return canvas.findByRole('menu');
};

export const RenameStyle: StoryObj = {
  ...oneStyle,
  name: "the style's menu renames it in place, leaving it on",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const menu = await openStyleMenu(canvasElement);

    await user.click(within(menu).getByRole('menuitem', { name: 'Rename' }));

    const field = canvas.getByRole('textbox', { name: 'Profile name' });
    await waitFor(() => expect(field).toHaveFocus());
    await user.clear(field);
    await user.type(field, 'Night Comic{Enter}');

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RenameProfile',
        url: 'example.com',
        profileName: 'Night Comic',
      })
    );
    await expect(
      await canvas.findByRole('checkbox', { name: /^Night Comic/ })
    ).toBeChecked();
  },
};

export const DeleteStyle: StoryObj = {
  ...oneStyle,
  name: "the style's menu deletes the whole style once confirmed",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const menu = await openStyleMenu(canvasElement);

    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() =>
      expect(within(menu).getByText('Delete this style?')).toBeVisible()
    );
    await user.click(within(menu).getByRole('button', { name: 'Delete' }));

    await expect(sendMessage).toHaveBeenCalledWith({
      name: 'DeleteStyle',
      url: 'example.com',
    });
    await waitFor(() =>
      expect(canvas.queryByRole('checkbox', { name: /^Style/ })).toBeNull()
    );
  },
};

export const MenuKeepsToggle: StoryObj = {
  ...oneStyle,
  name: "clicking around the style's menu never turns the style off",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = await openStyleMenu(canvasElement);

    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    await user.click(within(menu).getByText('Delete this style?'));
    await user.click(within(menu).getByRole('button', { name: 'Cancel' }));

    await expect(
      canvas.getByRole('checkbox', { name: /^Style/ })
    ).toBeChecked();
  },
};

export const PublishStyle: StoryObj = {
  ...oneStyle,
  name: "the style's menu publishes it to the Gallery",
  play: async ({ canvasElement }) => {
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const menu = await openStyleMenu(canvasElement);

    await user.click(
      await within(menu).findByRole('menuitem', { name: 'Publish to Gallery' })
    );

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PublishProfileToGallery',
        url: 'example.com',
        profileId: 'default',
      })
    );
  },
};
