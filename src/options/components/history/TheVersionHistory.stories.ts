import type { Meta, StoryObj } from '@storybook/vue';

import type { VersionChange, VersionPreview, Version } from '@stylebot/types';

import { set, subDays } from 'date-fns';

import TheHistoryTab from '../TheHistoryTab.vue';
import { optionsPage } from '@stylebot/storybook/mocks/options-page';

const meta: Meta = {
  title: 'Options/Version history',
  component: TheHistoryTab,
  parameters: { padded: false },
};

export default meta;

/**
 * Relative to now, so the day grouping reads Today / Yesterday / a weekday
 * whenever a story runs.
 */
const at = (daysAgo: number, hours: number, minutes: number): string =>
  set(subDays(new Date(), daysAgo), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();

const versions: Array<Version> = [
  {
    id: 'v-7',
    modifiedTime: at(0, 12, 20),
    source: 'local',
    restoredFrom: at(0, 11, 45),
  },
  { id: 'v-6', modifiedTime: at(0, 12, 2), source: 'local' },
  { id: 'v-5', modifiedTime: at(0, 11, 45), source: 'local' },
  { id: 'v-4', modifiedTime: at(1, 22, 54), source: 'sync' },
  { id: 'v-3', modifiedTime: at(1, 22, 38), source: 'local' },
  { id: 'v-2', modifiedTime: at(2, 21, 21), source: 'local' },
  { id: 'v-1', modifiedTime: at(9, 20, 23), source: 'local' },
];

const change = (overrides: Partial<VersionChange> = {}): VersionChange => ({
  addedUrls: [],
  changedUrls: [],
  removedUrls: [],
  ...overrides,
});

const preview = (
  styleCount: number,
  overrides: Partial<VersionChange> = {}
): VersionPreview => ({ styleCount, ...change(overrides) });

const changes: Record<string, VersionChange> = {
  'v-7': change({ changedUrls: ['github.com'] }),
  'v-6': change({ changedUrls: ['github.com'] }),
  'v-5': change({ removedUrls: ['news.ycombinator.com'] }),
  'v-4': change({ changedUrls: ['github.com', 'www.theverge.com'] }),
  'v-3': change({ addedUrls: ['news.ycombinator.com'] }),
  'v-2': change(),
  'v-1': change({ addedUrls: ['old.reddit.com'] }),
};

const previews: Record<string, VersionPreview> = {
  'v-7': preview(10),
  'v-6': preview(10, { changedUrls: ['github.com'] }),
  'v-5': preview(10, { changedUrls: ['github.com'] }),
  'v-4': preview(11, {
    addedUrls: ['news.ycombinator.com'],
    changedUrls: ['github.com'],
  }),
  'v-3': preview(11, {
    addedUrls: ['news.ycombinator.com'],
    changedUrls: ['github.com', 'www.theverge.com'],
  }),
  'v-2': preview(10, {
    changedUrls: ['github.com'],
    removedUrls: ['old.reddit.com'],
  }),
  'v-1': preview(9, {
    addedUrls: ['news.ycombinator.com', 'www.bbc.com'],
    removedUrls: ['old.reddit.com'],
  }),
};

const history = (overrides: Record<string, unknown> = {}) => ({
  chrome: {
    versionHistory: {
      versions,
      previews,
      changes,
      total: versions.length,
      ...overrides,
    },
  },
});

export const VersionList: StoryObj = {
  ...optionsPage('Version history'),
  parameters: history(),
};

/* Nothing has been edited yet, which is what a new profile looks like. */
export const Empty: StoryObj = {
  ...optionsPage('Version history'),
  parameters: {
    chrome: {
      versionHistory: {
        versions: [],
        previews: {},
        changes: {},
        total: 0,
      },
    },
  },
};

export const MoreToShow: StoryObj = {
  ...optionsPage('Version history'),
  parameters: history({ total: 48 }),
};
