import type { Meta } from '@storybook/vue';

import ShortcutKbd from './ShortcutKbd.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/ShortcutKbd',
  component: ShortcutKbd,
  argTypes: {
    value: { control: 'text' },
    small: { control: 'boolean' },
    mac: { control: 'boolean' },
  },
  args: { value: 'alt+shift+r', small: false },
};

export default meta;

export const Playground = playground(
  { ShortcutKbd },
  `<shortcut-kbd :value="value" :small="small" :mac="mac" />`
);

export const Variants = matrix({
  components: { ShortcutKbd },
  rows: [
    { label: 'alt+shift+r', attrs: 'value="alt+shift+r"' },
    { label: 'ctrl+k', attrs: 'value="ctrl+k"' },
    { label: 'Escape', attrs: 'value="Escape"' },
    { label: '?', attrs: 'value="?"' },
  ],
  columns: [
    { label: 'Default', cell: attrs => `<shortcut-kbd ${attrs} />` },
    { label: 'Small', cell: attrs => `<shortcut-kbd ${attrs} small />` },
  ],
});

/*
 * Every modifier gets its own icon on macOS; off Mac they fall back to
 * readable words instead (Alt/Shift/Win/Ctrl), so both need coverage.
 */
export const ModifierKeys = matrix({
  components: { ShortcutKbd },
  rows: [
    { label: 'Option', attrs: 'value="alt"' },
    { label: 'Shift', attrs: 'value="shift"' },
    { label: 'Command', attrs: 'value="command"' },
    { label: 'Control', attrs: 'value="ctrl"' },
    { label: 'Option + Shift + R', attrs: 'value="alt+shift+r"' },
    { label: 'Command + K', attrs: 'value="command+k"' },
    { label: 'Shift + Control + K', attrs: 'value="shift+ctrl+k"' },
    { label: 'Command + Shift + P', attrs: 'value="command+shift+p"' },
    { label: 'Option + Escape', attrs: 'value="alt+Escape"' },
    { label: 'Command + Arrow Up', attrs: 'value="command+arrowup"' },
    {
      label: 'Every modifier + R',
      attrs: 'value="ctrl+alt+shift+command+r"',
    },
  ],
  columns: [
    { label: 'macOS', cell: attrs => `<shortcut-kbd ${attrs} mac />` },
    {
      label: 'Windows',
      cell: attrs => `<shortcut-kbd ${attrs} :mac="false" />`,
    },
  ],
});
