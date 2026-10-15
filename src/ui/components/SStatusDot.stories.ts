import type { Meta } from '@storybook/vue';

import SStatusDot from './SStatusDot.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SStatusDot',
  component: SStatusDot,
  argTypes: {
    tone: {
      control: 'radio',
      options: ['success', 'warning', 'danger', 'accent', 'neutral'],
    },
    size: { control: { type: 'number', min: 4, max: 12 } },
  },
  args: { tone: 'success', size: 6 },
};

export default meta;

const components = { SStatusDot };

export const Playground = playground(
  components,
  `<s-status-dot :tone="tone" :size="size" />`
);

export const Tones = fromTemplate(
  components,
  `
  <div class="sb-row" style="align-items: center">
    <s-status-dot tone="success" />
    <s-status-dot tone="warning" />
    <s-status-dot tone="danger" />
    <s-status-dot tone="accent" />
    <s-status-dot tone="neutral" />
    <s-status-dot tone="success" :size="8" />
  </div>
`
);
