import type { Meta } from '@storybook/vue';

import SChip from './SChip.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SChip',
  component: SChip,
};

export default meta;

export const Default = fromTemplate(
  { SChip },
  `
  <div class="sb-row">
    <s-chip>h1</s-chip>
    <s-chip>.article-body</s-chip>
    <s-chip>#main > p</s-chip>
  </div>
`
);
