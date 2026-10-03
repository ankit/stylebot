import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, within } from '@storybook/test';

import TheKeyboardShortcuts from './TheKeyboardShortcuts.vue';
import { optionsPage } from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Keyboard shortcuts',
  tags: ['test'],
  component: TheKeyboardShortcuts,
  parameters: { padded: false },
};

export default meta;

export const SetInBrowser: StoryObj = {
  ...optionsPage('Basics', {}, async root => {
    const canvas = within(root);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');

    await expect(
      canvas.getByText('Shortcuts are set in your browser.')
    ).toBeVisible();
    await expect(root.querySelector('.recorder')).toBeNull();
    // Reader mode and grayscale come without a shortcut.
    await expect(canvas.getAllByText('Not set')).toHaveLength(2);

    await user.click(canvas.getByRole('button', { name: 'Change shortcuts' }));

    await expect(sendMessage).toHaveBeenCalledWith({
      name: 'OpenShortcutsPage',
    });
  }),
  name: 'shortcuts show as keys with a button to change them in the browser',
};
