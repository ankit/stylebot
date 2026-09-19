import type { Meta } from '@storybook/vue';

import ShortcutKbd from './ShortcutKbd.vue';
import { fromTemplate } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/ShortcutKbd',
  component: ShortcutKbd,
};

export default meta;

export const Combos = fromTemplate(
  { ShortcutKbd },
  `
  <div class="sb-stack">
    <shortcut-kbd value="alt+shift+r" />
    <shortcut-kbd value="ctrl+k" />
    <shortcut-kbd value="Escape" />
    <shortcut-kbd value="?" />
    <shortcut-kbd small value="alt+shift+r" />
  </div>
`
);
