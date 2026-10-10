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

const CLI_REQUEST = { permissions: ['nativeMessaging'] };

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

export const ShowsConnected: StoryObj = {
  ...cliAccessCard({ options: { cliAccess: true } }, async root => {
    await expect(await within(root).findByRole('status')).toHaveTextContent(
      'Connected to your terminal'
    );
  }),
  parameters: {
    chrome: {
      permissions: { granted: true },
      storage: { 'cli-connected': true },
    },
  },
  name: 'says it is connected while the CLI host is up',
};

export const ShowsNotConnected: StoryObj = {
  ...cliAccessCard({ options: { cliAccess: true } }, async root => {
    await expect(await within(root).findByRole('status')).toHaveTextContent(
      'Not connected. Run this in your terminal: stylebot install'
    );
  }),
  parameters: { chrome: { permissions: { granted: true } } },
  name: 'says how to connect while the setting is on without a CLI host',
};

export const NoStatusWhileOff: StoryObj = {
  ...cliAccessCard({}, async root => {
    await within(root).findByRole('heading', {
      name: /Let apps on this computer control Stylebot/,
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    await expect(within(root).queryByRole('status')).toBeNull();
  }),
  parameters: { chrome: { storage: { 'cli-connected': true } } },
  name: 'shows no status while the setting is off',
};

export const RowTurnsItOn: StoryObj = {
  ...cliAccessCard({}, async (root, store) => {
    await user.click(
      within(root).getByText(/^Apps and coding agents on this computer/)
    );

    await waitFor(() => expect(store.state.options?.cliAccess).toBe(true));
    await expect(toggle(root)).toBeChecked();
  }),
  parameters: { chrome: { permissions: { allowRequest: true } } },
  name: 'clicking anywhere on the row turns it on',
};

export const StatusDoesNotToggle: StoryObj = {
  ...cliAccessCard({ options: { cliAccess: true } }, async (root, store) => {
    await waitFor(() => expect(toggle(root)).toBeChecked());
    await user.click(within(root).getByText('stylebot install'));

    await new Promise(resolve => setTimeout(resolve, 50));
    await expect(toggle(root)).toBeChecked();
    await expect(store.state.options?.cliAccess).toBe(true);
  }),
  parameters: { chrome: { permissions: { granted: true } } },
  name: 'clicking the install command leaves it on, so it can be copied',
};
