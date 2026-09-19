import type { Meta } from '@storybook/vue';

import SCard from './SCard.vue';
import Heading from './Heading.vue';
import SText from './SText.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SCard',
  component: SCard,
};

export default meta;

export const Default = fromTemplate(
  { SCard, Heading, SText },
  `
  <s-card style="width: 320px; padding: 16px">
    <heading as="h2" size="sm">Card title</heading>
    <s-text size="caption" variant="muted">Supporting copy inside a card.</s-text>
  </s-card>
`
);
