import type { Meta, StoryObj } from '@storybook/vue';
import type { GalleryPreviewHandlers } from '@stylebot/gallery';
import type { GalleryStyle, StyleColorScheme } from '@stylebot/types';

import GalleryPreview from './GalleryPreview.vue';

const meta: Meta = {
  title: 'Gallery Preview/Controls',
  component: GalleryPreview,
};

export default meta;

const style: GalleryStyle = {
  id: 42,
  site: 'news.ycombinator.com',
  slug: 'edition',
  name: 'Edition',
  description: 'A newspaper look, in light and dark',
  author: { id: 'b7Rr2KdQ0z', username: 'maya' },
  version: 2,
  installs: 120,
  createdAt: 1791849600000,
  updatedAt: 1792022400000,
  screenshot: '/screenshots/42/2',
};

const handlers: GalleryPreviewHandlers = {
  install: async () => ({ ok: true, profileName: style.name }),
  undo: async () => ({ ok: true }),
  cancel: () => undefined,
  compare: () => undefined,
  setScheme: () => undefined,
};

const bar = (scheme?: StyleColorScheme): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { GalleryPreview },
    data: () => ({
      styleData: style,
      handlers,
      scheme,
      appearance: globals.theme === 'dark' ? 'dark' : 'light',
    }),
    template: `
      <gallery-preview
        :style-data="styleData"
        :handlers="handlers"
        :appearance="appearance"
        :scheme="scheme"
      />`,
  }),
});

export const Default = bar();

export const WithColorScheme = bar('system');
