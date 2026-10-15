import type { StoryObj } from '@storybook/vue';

import App from '@/apps/popup/App.vue';
import type { GalleryStyle } from '@stylebot/types';

import type { ChromeShimOptions } from '../mocks/chrome';
import { GALLERY_PUBLISHED_SCREENSHOT } from '../mocks/chrome';

export const style = (url: string, enabled = true) => ({
  url,
  css: 'h1 { color: red; }',
  enabled,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
});

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

/**
 * State past the rating prompt's bar: three saved styles, one of them for
 * the popup's page, installed a month ago.
 */
export const ratingEligible = (
  storage: Record<string, unknown> = {}
): ChromeShimOptions => ({
  styles: [style('example.com'), style('news.site'), style('docs.site')],
  storage: {
    'install-time': Date.now() - 30 * 24 * 60 * 60 * 1000,
    ...storage,
  },
});

const galleryStyle = (
  id: string,
  name: string,
  installs: number,
  author: string | null
): GalleryStyle => ({
  id,
  site: 'example.com',
  group: 'example.com',
  slug: id,
  name,
  description: null,
  author: { id: `author-${id}`, name: author },
  version: 1,
  installs,
  createdAt: 0,
  updatedAt: 0,
  screenshot: GALLERY_PUBLISHED_SCREENSHOT,
  status: 'live',
});

// The site's most installed gallery styles, as the popup suggests them.
export const gallerySuggestions: Array<GalleryStyle> = [
  galleryStyle('tokyo-night', 'Tokyo Night', 1240, 'maya'),
  galleryStyle('paper', 'Paper', 1, null),
];
