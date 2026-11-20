import type { Meta } from '@storybook/vue';

import SCodeText from './SCodeText.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SCodeText',
  component: SCodeText,
  argTypes: {
    text: { control: 'text' },
    code: { control: 'text' },
  },
  args: { text: 'Force !important', code: '!important' },
};

export default meta;

export const Playground = playground(
  { SCodeText },
  `<s-code-text :text="text" :code="code" />`
);

export const Variants = matrix({
  components: { SCodeText },
  rows: [
    {
      label: 'Code at the end',
      attrs: 'text="Force !important" code="!important"',
    },
    {
      label: 'Code first',
      attrs: 'text="!important を強制" code="!important"',
    },
    {
      label: 'Code in the middle',
      attrs: 'text="Styled by .title a here" code=".title a"',
    },
    { label: 'No match', attrs: 'text="Plain text" code="!important"' },
  ],
  columns: [{ label: 'Default', cell: attrs => `<s-code-text ${attrs} />` }],
});
