import type { Meta } from '@storybook/vue';

import SText from './SText.vue';
import { fromTemplate } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/SText',
  component: SText,
};

export default meta;

export const SizesAndVariants = fromTemplate(
  { SText },
  `
  <div class="sb-stack">
    <s-text size="label">Label text</s-text>
    <s-text size="body">Body text — the default paragraph size.</s-text>
    <s-text size="caption">Caption text</s-text>
    <s-text size="small">Small text</s-text>
    <s-text variant="muted">Muted body text</s-text>
    <s-text variant="primary">Primary body text</s-text>
    <s-text size="caption" variant="muted">Muted caption</s-text>
  </div>
`
);
