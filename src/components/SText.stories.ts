import type { Meta } from '@storybook/vue';

import SText from './SText.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Typography/SText',
  component: SText,
  argTypes: {
    size: { control: 'radio', options: ['label', 'body', 'caption', 'small'] },
    variant: { control: 'radio', options: ['default', 'muted', 'primary'] },
    as: { control: 'select', options: ['p', 'span', 'div'] },
    text: { control: 'text' },
  },
  args: {
    size: 'body',
    variant: 'default',
    as: 'p',
    text: 'Styles are saved per site and applied on every visit.',
  },
};

export default meta;

export const Playground = playground(
  { SText },
  `<s-text :as="as" :size="size" :variant="variant">{{ text }}</s-text>`
);

export const Variants = matrix({
  components: { SText },
  rows: [
    { label: 'label', attrs: 'size="label"' },
    { label: 'body', attrs: 'size="body"' },
    { label: 'caption', attrs: 'size="caption"' },
    { label: 'small', attrs: 'size="small"' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs => `<s-text ${attrs}>The quick brown fox</s-text>`,
    },
    {
      label: 'Muted',
      cell: attrs =>
        `<s-text ${attrs} variant="muted">The quick brown fox</s-text>`,
    },
    {
      label: 'Primary',
      cell: attrs =>
        `<s-text ${attrs} variant="primary">The quick brown fox</s-text>`,
    },
  ],
});
