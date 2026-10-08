import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheCliAccess from './TheCliAccess.vue';
import { cliAccessCard } from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/CLI Access',
  tags: ['test'],
  component: TheCliAccess,
};

export default meta;

const toggle = (root: HTMLElement) =>
  within(root).getByRole('checkbox', {
    name: /Let apps on this computer control Stylebot/,
  });

const CLI_REQUEST = {
  permissions: ['nativeMessaging', 'scripting'],
  origins: ['<all_urls>'],
};

export const SavesOnceGranted: StoryObj = {
  ...cliAccessCard({}, async (root, store) => {
    await user.click(toggle(root));

    await expect(chrome.permissions.request).toHaveBeenCalledWith(
      CLI_REQUEST,
      expect.any(Function)
    );
    await waitFor(() => expect(store.state.options?.cliAccess).toBe(true));
    await expect(toggle(root)).toBeChecked();
  }),
  parameters: { chrome: { permissions: { allowRequest: true } } },
  name: 'turning it on asks for the permissions and saves once they are granted',
};

export const StaysOffWhenDenied: StoryObj = {
  ...cliAccessCard({}, async (root, store) => {
    await user.click(toggle(root));

    await expect(chrome.permissions.request).toHaveBeenCalledWith(
      CLI_REQUEST,
      expect.any(Function)
    );
    await waitFor(() => expect(toggle(root)).not.toBeChecked());
    await expect(store.state.options?.cliAccess).toBe(false);
  }),
  parameters: { chrome: { permissions: { allowRequest: false } } },
  name: 'turning it on stays off without saving when the permissions are denied',
};

export const RemovesPermissionsWhenOff: StoryObj = {
  ...cliAccessCard({ options: { cliAccess: true } }, async (root, store) => {
    await waitFor(() => expect(toggle(root)).toBeChecked());
    await user.click(toggle(root));

    await waitFor(() => expect(store.state.options?.cliAccess).toBe(false));
    await expect(chrome.permissions.remove).toHaveBeenCalledWith(
      { permissions: ['nativeMessaging'] },
      expect.any(Function)
    );
    await expect(toggle(root)).not.toBeChecked();
  }),
  parameters: { chrome: { permissions: { granted: true } } },
  name: 'turning it off saves it off and gives the native host permission back',
};

export const OffWithoutPermissions: StoryObj = {
  ...cliAccessCard({ options: { cliAccess: true } }, async root => {
    await waitFor(() => expect(chrome.permissions.contains).toHaveBeenCalled());
    // Lets the card apply the answer before checking it stayed off.
    await new Promise(resolve => setTimeout(resolve, 50));
    await expect(toggle(root)).not.toBeChecked();
  }),
  parameters: { chrome: { permissions: { granted: false } } },
  name: 'shows off when the setting is on but the browser took the permissions back',
};
