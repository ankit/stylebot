import type { Meta, StoryObj } from '@storybook/vue';

import TheStylebotApp from '@/editor/components/TheStylebotApp.vue';
import {
  editorWindow,
  WINDOW_TAB,
  WITH_RULE,
} from '@stylebot/storybook/editor-story';

const meta: Meta = {
  title: 'Editor/Window',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

export const Connected: StoryObj = editorWindow(WITH_RULE);

export const WaitingForPage: StoryObj = editorWindow({
  ...WITH_RULE,
  pageConnected: false,
});

export const TabInBackground: StoryObj = editorWindow({
  ...WITH_RULE,
  tab: { ...WINDOW_TAB, active: false },
});

export const Code: StoryObj = editorWindow({
  ...WITH_RULE,
  options: { mode: 'code' },
});
