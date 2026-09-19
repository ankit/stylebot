import type { Meta } from '@storybook/vue';

import SButton from './SButton.vue';
import { ChevronDownIcon } from '@stylebot/icons';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SButton',
  component: SButton,
  argTypes: {
    variant: { control: 'radio', options: ['default', 'ghost', 'danger'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    trailingIcon: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    disabled: false,
    label: 'Save',
    trailingIcon: false,
  },
};

export default meta;

const components = { SButton, ChevronDownIcon };

export const Playground = playground(
  components,
  `
  <s-button :variant="variant" :disabled="disabled">
    {{ label }}
    <template v-if="trailingIcon" #trailing>
      <chevron-down-icon :size="14" />
    </template>
  </s-button>
`
);

export const Variants = matrix({
  components,
  rows: [
    { label: 'default', attrs: '' },
    { label: 'ghost', attrs: 'variant="ghost"' },
    { label: 'danger', attrs: 'variant="danger"' },
  ],
  columns: [
    { label: 'Default', cell: attrs => `<s-button ${attrs}>Save</s-button>` },
    {
      label: 'Disabled',
      cell: attrs => `<s-button ${attrs} disabled>Save</s-button>`,
    },
    {
      label: 'With trailing',
      cell: attrs => `
        <s-button ${attrs}>
          Options
          <template #trailing><chevron-down-icon :size="14" /></template>
        </s-button>`,
    },
  ],
});
