import type { Meta, StoryObj } from '@storybook/vue';

import TheStylebotApp from '../TheStylebotApp.vue';
import { editor } from '@stylebot/storybook/editor-story';

const meta: Meta = {
  title: 'Editor/TheKeyboardShortcutsView',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

export const Default: StoryObj = editor({ help: true });

export const NoGlobalShortcuts: StoryObj = editor({
  help: true,
  commands: { style: '', stylebot: '', grayscale: '', readability: '' },
});
