import type { Meta } from '@storybook/vue';

import SCheckbox from './SCheckbox.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SCheckbox',
  component: SCheckbox,
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { checked: true, disabled: false },
};

export default meta;

const components = { SCheckbox };

export const Playground = playground(
  components,
  `<s-checkbox :value="checked" :disabled="disabled" />`
);

export const States = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-checkbox :value="true" />
    <s-checkbox :value="false" />
    <s-checkbox :value="true" disabled />
    <s-checkbox :value="false" disabled />
  </div>
`
);
