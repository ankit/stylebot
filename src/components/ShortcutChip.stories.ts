import type { Meta } from '@storybook/vue';

import ShortcutChip from './ShortcutChip.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/ShortcutChip',
  component: ShortcutChip,
  argTypes: {
    value: { control: 'text' },
    small: { control: 'boolean' },
    muted: { control: 'boolean' },
  },
  args: { value: 'alt+shift+m', small: false, muted: false },
};

export default meta;

export const Playground = playground(
  { ShortcutChip },
  `<shortcut-chip :value="value" :small="small" :muted="muted" />`
);

export const Variants = matrix({
  components: { ShortcutChip },
  rows: [
    { label: 'default', attrs: '' },
    { label: 'small', attrs: 'small' },
  ],
  columns: [
    {
      label: 'Default',
      cell: attrs => `<shortcut-chip ${attrs} value="alt+shift+m" />`,
    },
    {
      label: 'Muted',
      cell: attrs => `<shortcut-chip ${attrs} muted value="Escape" />`,
    },
  ],
});
