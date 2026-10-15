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
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: { suggestions: gallerySuggestions },
});
