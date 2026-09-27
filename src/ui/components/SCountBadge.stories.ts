import type { Meta } from '@storybook/vue';

import SCountBadge from './SCountBadge.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SCountBadge',
  component: SCountBadge,
  argTypes: { count: { control: { type: 'number', min: 0, max: 999 } } },
  args: { count: 4 },
};

export default meta;

export const Playground = playground(
  { SCountBadge },
  `<s-count-badge :count="count" />`
);

export const Variants = fromTemplate(
  { SCountBadge },
  `
  <div class="sb-row">
    <s-count-badge :count="1" />
    <s-count-badge :count="12" />
    <s-count-badge :count="99">99+</s-count-badge>
  </div>
`
);
