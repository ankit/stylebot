import type { Meta, StoryObj } from '@storybook/vue';

import App from './App.vue';
import type { ChromeShimOptions } from '@sb/mocks/chrome';

const meta: Meta = {
  title: 'Browser Action',
  component: App,
  parameters: { padded: false },
};

export default meta;

const style = (url: string, enabled = true) => ({
  url,
  css: 'h1 { color: red; }',
  enabled,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
});

const popup = (chrome: ChromeShimOptions = {}): StoryObj => ({
  render: () => ({
    components: { App },
    template: '<div class="sb-popup"><app /></div>',
  }),
  parameters: { chrome },
});

export const NoStyle = popup();

export const WithStyle = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
});

export const MultipleStyles = popup({
  styles: [
    style('example.com'),
    style('example.com/article', false),
    style('*.example.com'),
  ],
  defaultStyle: style('example.com'),
});

export const EditorOpen = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  isOpen: true,
});

export const NotReaderable = popup({ pageReaderable: false });

export const Restricted = popup({ tabUrl: 'chrome://extensions' });

export const ReleaseNotification = popup({
  storage: { 'notification~release/3.2': false },
});

export const SyncEnabled = popup({
  storage: { 'google-drive-sync-enabled': true },
});
