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
    mac: { control: 'boolean' },
  },
  args: { value: 'alt+shift+m', small: false, muted: false },
};

export default meta;

export const Playground = playground(
  { ShortcutChip },
  `<shortcut-chip :value="value" :small="small" :muted="muted" :mac="mac" />`
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

/* Every modifier gets its own icon on macOS; off Mac they fall back to
   readable words instead (Alt/Shift/Win/Ctrl), so both need coverage. */
export const ModifierKeys = matrix({
  components: { ShortcutChip },
  rows: [
    { label: 'Option', attrs: 'value="alt"' },
    { label: 'Shift', attrs: 'value="shift"' },
    { label: 'Command', attrs: 'value="command"' },
    { label: 'Control', attrs: 'value="ctrl"' },
    { label: 'Option + Shift + M', attrs: 'value="alt+shift+m"' },
    { label: 'Command + K', attrs: 'value="command+k"' },
  ],
  columns: [
    { label: 'macOS', cell: attrs => `<shortcut-chip ${attrs} mac />` },
    {
      label: 'Windows',
      cell: attrs => `<shortcut-chip ${attrs} :mac="false" />`,
    },
  ],
});
