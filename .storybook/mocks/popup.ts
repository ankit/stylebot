import type { StoryObj } from '@storybook/vue';

import App from '@/popup/App.vue';
import type { ChromeShimOptions } from './chrome';

export const style = (url: string, enabled = true) => ({
  url,
  css: 'h1 { color: red; }',
  enabled,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
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
