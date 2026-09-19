import type { Meta } from '@storybook/vue';

import Heading from './Heading.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Heading',
  component: Heading,
};

export default meta;

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
