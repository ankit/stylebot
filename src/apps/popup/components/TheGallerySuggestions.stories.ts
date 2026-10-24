import type { Meta } from '@storybook/vue';

import TheGallerySuggestions from './TheGallerySuggestions.vue';
import {
  gallerySuggestions,
  popup,
  style,
} from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Gallery Suggestions',
  component: TheGallerySuggestions,
  parameters: { padded: false },
};

export default meta;

export const Suggestions = popup({
  gallery: { suggestions: gallerySuggestions, total: 14 },
});

export const OnAStyledSite = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: { suggestions: gallerySuggestions, total: 14 },
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
