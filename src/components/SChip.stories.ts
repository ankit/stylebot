import type { Meta } from '@storybook/vue';

import SChip from './SChip.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SChip',
  component: SChip,
  argTypes: { text: { control: 'text' } },
  args: { text: '.article-body' },
};

export default meta;

export const Playground = playground({ SChip }, `<s-chip>{{ text }}</s-chip>`);

export const Variants = fromTemplate(
  { SChip },
  `
  <div class="sb-row">
    <s-chip>h1</s-chip>
    <s-chip>.article-body</s-chip>
    <s-chip>#main > p</s-chip>
  </div>
`
);
