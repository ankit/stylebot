import type { Meta } from '@storybook/vue';

import Heading from './Heading.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Typography/Heading',
  component: Heading,
  argTypes: {
    size: { control: 'radio', options: ['lg', 'md', 'sm'] },
    as: { control: 'select', options: ['h1', 'h2', 'h3', 'div'] },
    text: { control: 'text' },
  },
  args: { size: 'md', as: 'h2', text: 'Keyboard shortcuts' },
};

export default meta;

export const Playground = playground(
  { Heading },
  `<heading :as="as" :size="size">{{ text }}</heading>`
);

export const Sizes = fromTemplate(
  { Heading },
  `
  <div class="sb-stack">
    <heading as="h1" size="lg">Large heading</heading>
    <heading as="h2" size="md">Medium heading</heading>
    <heading as="h3" size="sm">Small heading</heading>
  </div>
`
);
