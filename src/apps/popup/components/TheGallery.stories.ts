import type { Meta, StoryObj } from '@storybook/vue';
import { within } from '@storybook/test';

import TheGallery from './TheGallery.vue';
import {
  gallerySuggestions,
  popup,
  style,
} from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Gallery',
  component: TheGallery,
  parameters: { padded: false },
};

export default meta;

export const Suggestions = popup({
  gallery: { suggestions: gallerySuggestions },
});

export const OnAStyledSite = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: { suggestions: gallerySuggestions },
});

export const Browsing: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: { suggestions: gallerySuggestions },
  }),
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByRole('button', {
      name: /Styles in Gallery/,
    });

    row.click();
  },
};

export const BrowsingAPreview = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: {
    suggestions: gallerySuggestions,
    previewing: gallerySuggestions[0],
  },
});

export const Previewing = popup({
  gallery: {
    suggestions: gallerySuggestions,
    previewing: gallerySuggestions[0],
  },
});

const longNamed = {
  ...gallerySuggestions[0],
  name: 'An Extremely Long Style Name That Tests Wrapping Nicely',
};

export const PreviewingLongName = popup({
  gallery: {
    suggestions: [
      longNamed,
      { ...gallerySuggestions[1], name: 'Monospaced Hacker News, Wrapped' },
    ],
    previewing: longNamed,
  },
});
