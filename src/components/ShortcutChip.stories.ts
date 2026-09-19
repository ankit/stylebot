import type { Meta } from '@storybook/vue';

import ShortcutChip from './ShortcutChip.vue';
import { fromTemplate } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/ShortcutChip',
  component: ShortcutChip,
};

export default meta;

export const Variants = fromTemplate(
  { ShortcutChip },
  `
  <div class="sb-row">
    <shortcut-chip value="alt+shift+m" />
    <shortcut-chip small value="i" />
    <shortcut-chip muted value="Escape" />
    <shortcut-chip small muted value="b" />
  </div>
`
);
