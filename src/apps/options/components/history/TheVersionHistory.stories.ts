import type { Meta, StoryObj } from '@storybook/vue';

import TheHistoryTab from '../TheHistoryTab.vue';
import { optionsPage } from '@stylebot/storybook/fixtures/options';

import { history } from './version-history.fixtures';

const meta: Meta = {
  title: 'Options/Version history',
  component: TheHistoryTab,
  parameters: { padded: false },
};

export default meta;

export const VersionList: StoryObj = {
  ...optionsPage('Version history'),
  parameters: { chrome: { versionHistory: history() } },
};

/* Nothing has been edited yet, which is what a new profile looks like. */
export const Empty: StoryObj = {
  ...optionsPage('Version history'),
  parameters: {
    chrome: {
      versionHistory: { versions: [], hasMore: false, sites: [] },
    },
  },
};
