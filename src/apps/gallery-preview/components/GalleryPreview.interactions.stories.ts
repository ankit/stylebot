import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';
import type { GalleryPreviewHandlers } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

import GalleryPreview from './GalleryPreview.vue';
import { WithSiteStyles } from './GalleryPreview.stories';

const meta: Meta = {
  title: 'Tests/Gallery Preview/Site Styles',
  tags: ['test'],
  component: GalleryPreview,
};

export default meta;

export const Position: StoryObj = {
  ...WithSiteStyles,
  name: "the card says where the style sits among the site's Gallery styles",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText('1 of 3 styles')).toBeInTheDocument();
  },
};

const longName: GalleryStyle = {
  id: 31,
  site: 'en.wikipedia.org',
  slug: 'reader',
  name: 'Wikipedia Reader',
  description: '',
  author: { id: 'uadVnkxtqU', username: 'ankit' },
  version: 1,
  installs: 13,
  createdAt: 1791849600000,
  updatedAt: 1792022400000,
  screenshot: '',
};

const handlers: GalleryPreviewHandlers = {
  install: async () => ({ ok: true, profileName: longName.name }),
  undo: async () => ({ ok: true }),
  cancel: () => undefined,
  compare: () => undefined,
  setOption: () => undefined,
  getSiteStyles: async () => [],
  preview: async () => ({ ok: true }),
};

export const InstalledNameFits: StoryObj = {
  // Installed once mounted, as the page reports it after an install.
  render: () => ({
    components: { GalleryPreview },
    data: () => ({ styleData: longName, installed: false, handlers }),
    mounted(this: { installed: boolean }) {
      this.installed = true;
    },
    template:
      '<gallery-preview :style-data="styleData" :handlers="handlers" :installed="installed" />',
  }),
  name: 'once installed the card widens to show the whole style name on one line',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByText('Wikipedia Reader installed');
    const card = canvas.getByRole('region', { name: 'Preview' });

    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
    await expect(title.getClientRects()).toHaveLength(1);
    await expect(title.clientHeight).toBeLessThanOrEqual(20);
    await expect(card.getBoundingClientRect().width).toBeGreaterThan(340);
  },
};
