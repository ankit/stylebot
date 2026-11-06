import type { Meta, StoryObj } from '@storybook/vue';
import type { GalleryPreviewHandlers } from '@stylebot/gallery';
import type {
  GalleryStyle,
  StyleOptionDeclarations,
  StyleOptionValues,
} from '@stylebot/types';

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
  setOption: () => undefined,
  getSiteStyles: async () => [],
  preview: async () => ({ ok: true }),
};

const SITE_STYLES: Array<GalleryStyle> = [
  style,
  { ...style, id: 43, slug: 'ink', name: 'Ink' },
  { ...style, id: 44, slug: 'paper', name: 'Paper' },
];

const SCHEME: StyleOptionDeclarations = {
  scheme: {
    type: 'select',
    values: ['system', 'light', 'dark'],
    default: 'system',
  },
};

const OPTIONS: StyleOptionDeclarations = {
  ...SCHEME,
  accent: {
    type: 'select',
    label: 'Accent',
    values: ['orange', 'mauve', 'blue'],
    default: 'orange',
    choices: {
      orange: { label: 'Orange', css: '#ff6600' },
      mauve: { label: 'Mauve', css: '#cba6f7' },
      blue: { label: 'Blue', css: '#89b4fa' },
    },
  },
  density: {
    type: 'select',
    label: 'Density',
    values: ['compact', 'comfortable'],
    default: 'comfortable',
    choices: {
      compact: { label: 'Compact', css: 'compact' },
      comfortable: { label: 'Comfortable', css: 'comfortable' },
    },
  },
  serif: {
    type: 'checkbox',
    label: 'Serif headlines',
    values: ['0', '1'],
    default: '1',
  },
};

const defaults = (options?: StyleOptionDeclarations): StyleOptionValues =>
  Object.fromEntries(
    Object.entries(options ?? {}).map(([name, { default: value }]) => [
      name,
      value,
    ])
  );

const bar = (
  options?: StyleOptionDeclarations,
  siteStyles: Array<GalleryStyle> = []
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { GalleryPreview },
    data: () => ({
      styleData: style,
      handlers: { ...handlers, getSiteStyles: async () => siteStyles },
      options,
      values: defaults(options),
      appearance: globals.theme === 'dark' ? 'dark' : 'light',
    }),
    template: `
      <gallery-preview
        :style-data="styleData"
        :handlers="handlers"
        :appearance="appearance"
        :options="options"
        :values="values"
      />`,
  }),
});

export const Default = bar();

export const WithColorScheme = bar(SCHEME);

export const WithOptions = bar(OPTIONS);

export const WithSiteStyles = bar(OPTIONS, SITE_STYLES);
