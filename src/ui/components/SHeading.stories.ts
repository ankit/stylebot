import type { Meta } from '@storybook/vue';

import SHeading from './SHeading.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Typography/SHeading',
  component: SHeading,
  argTypes: {
    size: { control: 'radio', options: ['xl', 'lg', 'md', 'sm'] },
    as: { control: 'select', options: ['h1', 'h2', 'h3', 'div'] },
    text: { control: 'text' },
  },
  args: { size: 'md', as: 'h2', text: 'Keyboard shortcuts' },
};

export default meta;

export const Playground = playground(
  { SHeading },
  `<s-heading :as="as" :size="size">{{ text }}</s-heading>`
);

export const Sizes = fromTemplate(
  { SHeading },
  `
  <div class="sb-stack">
    <s-heading as="h1" size="xl">Extra large heading</s-heading>
    <s-heading as="h2" size="lg">Large heading</s-heading>
    <s-heading as="h2" size="md">Medium heading</s-heading>
    <s-heading as="h3" size="sm">Small heading</s-heading>
  </div>
`
);
