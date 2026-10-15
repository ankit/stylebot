import type { Meta } from '@storybook/vue';

import SButton from './SButton.vue';
import SSpinner from './SSpinner.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SSpinner',
  component: SSpinner,
  argTypes: {
    size: { control: { type: 'number', min: 8, max: 32 } },
  },
  args: { size: 11 },
};

export default meta;

export const Playground = playground(
  { SSpinner },
  `<s-spinner :size="size" />`
);

export const InButtons = fromTemplate(
  { SButton, SSpinner },
  `
  <div class="sb-row">
    <s-button variant="primary" disabled><s-spinner /> Publishing…</s-button>
    <s-button disabled><s-spinner /> Loading…</s-button>
  </div>
`
);
