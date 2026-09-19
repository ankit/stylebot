import type { Meta, StoryObj } from '@storybook/vue';

import TheHelpDialog from './TheHelpDialog.vue';
import { createEditorStore } from '@stylebot/storybook/mocks/editor-store';

const meta: Meta = {
  title: 'Editor/TheHelpDialog',
  component: TheHelpDialog,
  parameters: { padded: false },
};

export default meta;

export const Default: StoryObj = {
  render: (_args, { globals }) => ({
    components: { TheHelpDialog },
    store: createEditorStore({
      help: true,
      options: { appearance: globals.theme },
    }),
    template: `
      <div class="stylebot-app" style="height: 100vh">
        <the-help-dialog />
      </div>
    `,
  }),
};

export const NoGlobalShortcuts: StoryObj = {
  render: (_args, { globals }) => ({
    components: { TheHelpDialog },
    store: createEditorStore({
      help: true,
      commands: { style: '', stylebot: '', grayscale: '', readability: '' },
      options: { appearance: globals.theme },
    }),
    template: `
      <div class="stylebot-app" style="height: 100vh">
        <the-help-dialog />
      </div>
    `,
  }),
};
