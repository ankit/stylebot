import type { Meta } from '@storybook/vue';

import STextInput from './STextInput.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/STextInput',
  component: STextInput,
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    multiline: { control: 'boolean' },
  },
  args: { value: 'Newspaper Dark', placeholder: 'Name', multiline: false },
};

export default meta;

const components = { STextInput };

export const Playground = playground(
  components,
  `<s-text-input :value="value" :placeholder="placeholder" :multiline="multiline" />`
);

export const Fields = fromTemplate(
  components,
  `
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px">
    <s-text-input value="Newspaper Dark" />
    <s-text-input placeholder="anonymous" />
    <s-text-input multiline value="For dark reading on HN" />
  </div>
`
);
