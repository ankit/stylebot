import type { StoryObj } from '@storybook/vue';

import App from '@/apps/popup/App.vue';
import type { ChromeShimOptions } from '../mocks/chrome';

export const style = (url: string, enabled = true) => ({
  url,
  css: 'h1 { color: red; }',
  enabled,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
});

/**
 * A sync that succeeds, for stories with sync on, since the popup syncs
 * as soon as it opens.
 */
export const syncSucceeds = {
  ok: true as const,
  metadata: {
    id: 'drive-file-id',
    modifiedTime: '2026-01-12T08:00:00Z',
    webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
    webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
  },
};

/**
 * A style with a Default profile and a Dark one, the first active.
 */
export const profiledStyle = (url: string, enabled = true) => ({
  ...style(url, enabled),
  profiles: {
    default: { name: '' },
    dark: { name: 'Dark', css: 'h1 { color: white; }' },
  },
  activeProfile: 'default',
});

/**
 * Renders the whole browser-action popup against a chrome shim seeded
 * with the given state.
 */
export const popup = (chrome: ChromeShimOptions = {}): StoryObj => ({
  render: () => ({
    components: { App },
    template: '<div class="sb-popup"><app /></div>',
  }),
  parameters: { chrome },
});
