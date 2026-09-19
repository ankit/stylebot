import type { Meta } from '@storybook/vue';

import SCountBadge from './SCountBadge.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SCountBadge',
  component: SCountBadge,
};

export default meta;

export const Default = fromTemplate(
  { SCountBadge },
  `
  <div class="sb-row">
    <s-count-badge :count="1" />
    <s-count-badge :count="12" />
    <s-count-badge>99+</s-count-badge>
  </div>
`
);
