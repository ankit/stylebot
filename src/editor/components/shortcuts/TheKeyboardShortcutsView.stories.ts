import type { Meta, StoryObj } from '@storybook/vue';

import TheStylebotApp from '../TheStylebotApp.vue';
import TheKeyboardShortcutsView from './TheKeyboardShortcutsView.vue';
import { editor } from '@stylebot/storybook/editor-story';
import { createEditorStore } from '@stylebot/storybook/mocks/editor-store';

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

/*
 * Windows shows word labels (Alt+Shift+M) instead of the Mac symbol icons
 * — the view itself doesn't otherwise differ, so this mounts it directly
 * rather than through the full editor() app shell.
 */
export const Windows: StoryObj = {
  render: (_args, { globals }) => ({
    components: { TheKeyboardShortcutsView },
    store: createEditorStore({
      help: true,
      options: { appearance: globals.theme },
    }),
    template: `
      <div style="height: 600px; width: 360px; display: flex; flex-direction: column">
        <the-keyboard-shortcuts-view :mac="false" />
      </div>
    `,
  }),
};
