import type { Meta } from '@storybook/vue';

import SCard from './SCard.vue';
import SHeading from './SHeading.vue';
import SText from './SText.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SCard',
  component: SCard,
};

export default meta;

export const Default = fromTemplate(
  { SCard, SHeading, SText },
  `
  <s-card style="width: 320px; padding: 16px">
    <s-heading as="h2" size="sm">Card title</s-heading>
    <s-text size="caption" variant="muted">Supporting copy inside a card.</s-text>
  </s-card>
`
);
