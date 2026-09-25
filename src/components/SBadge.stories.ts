import type { Meta } from '@storybook/vue';

import SBadge from './SBadge.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SBadge',
  component: SBadge,
  argTypes: {
    variant: { control: 'radio', options: ['muted', 'accent'] },
    label: { control: 'text' },
  },
  args: { variant: 'muted', label: 'Restored' },
};

export default meta;

const components = { SBadge };

export const Playground = playground(
  components,
  `<s-badge :variant="variant">{{ label }}</s-badge>`
);

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-badge variant="accent">Current</s-badge>
    <s-badge variant="muted">Restored</s-badge>
  </div>
`
);
