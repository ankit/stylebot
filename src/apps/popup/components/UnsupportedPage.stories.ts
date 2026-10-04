import type { Meta } from '@storybook/vue';

import UnsupportedPage from './UnsupportedPage.vue';
import { popup } from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Unsupported Page',
  component: UnsupportedPage,
  parameters: { padded: false },
};

export default meta;

const syncOn = {
  'google-drive-sync-enabled': true,
  'google-drive-sync-state': {
    lastSyncedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
};

export const NewTab = popup({ tabUrl: 'chrome://newtab/', storage: syncOn });

export const BrowserPage = popup({ tabUrl: 'chrome://flags' });

export const ExtensionPage = popup({
  tabUrl: 'chrome-extension://abcdefghijklmnop/options.html',
  storage: syncOn,
});

export const WebStore = popup({
  tabUrl: 'https://chromewebstore.google.com/detail/stylebot/abc',
  pageSupport: 'unreachable',
  storage: syncOn,
});

export const LocalFile = popup({
  tabUrl: 'file:///Users/me/notes.html',
  pageSupport: 'unreachable',
  storage: syncOn,
});

export const PdfFile = popup({
  tabUrl: 'https://example.com/report.pdf',
  pageSupport: 'unsupported',
});

export const NeedsReload = popup({
  tabUrl: 'https://example.com/article',
  pageSupport: 'unreachable',
});

export const EdgeSettings = popup({ tabUrl: 'edge://settings/profiles' });
