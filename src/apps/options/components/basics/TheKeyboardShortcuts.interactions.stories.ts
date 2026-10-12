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

    await expect(root.querySelector('.recorder')).toBeNull();
    // Reader mode and grayscale come without a shortcut.
    const notSet = canvas.getAllByRole('button', { name: 'Not set' });
    await expect(notSet).toHaveLength(2);

    await user.click(
      canvas.getByRole('button', { name: 'Change in browser settings' })
    );
    await expect(sendMessage).toHaveBeenCalledWith({
      name: 'OpenShortcutsPage',
    });

    sendMessage.mockClear();
    await user.click(notSet[0]);
    await expect(sendMessage).toHaveBeenCalledWith({
      name: 'OpenShortcutsPage',
    });
  }),
  name: 'shortcuts show as keys, and the header link or a missing one opens the browser’s shortcut settings',
};
