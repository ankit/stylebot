import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

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
