import type { Meta } from '@storybook/vue';

import ShortcutKbd from './ShortcutKbd.vue';
import { matrix, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/ShortcutKbd',
  component: ShortcutKbd,
  argTypes: {
    value: { control: 'text' },
    small: { control: 'boolean' },
  },
  args: { value: 'alt+shift+r', small: false },
};

export default meta;

export const Playground = playground(
  { ShortcutKbd },
  `<shortcut-kbd :value="value" :small="small" />`
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
