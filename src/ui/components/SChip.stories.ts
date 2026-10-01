import type { Meta } from '@storybook/vue';

import SChip from './SChip.vue';
import { ArrowUpRightIcon } from '@stylebot/icons';
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

export const Small = fromTemplate(
  { SChip, ArrowUpRightIcon },
  `
  <div class="sb-row">
    <s-chip size="small" @click="() => {}">
      .title
      <template #icon><arrow-up-right-icon :size="11" /></template>
    </s-chip>
    <s-chip size="small" variant="warning" @click="() => {}">
      .title
      <template #icon><arrow-up-right-icon :size="11" /></template>
    </s-chip>
    <s-chip size="small" variant="outline" @click="() => {}">div h1</s-chip>
    <s-chip size="small" variant="outline" @click="() => {}">
      .sb-page h1
      <template #icon><arrow-up-right-icon :size="11" /></template>
    </s-chip>
  </div>
`
);
