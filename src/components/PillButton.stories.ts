import type { Meta } from '@storybook/vue';

import PillButton from './PillButton.vue';
import ShortcutKbd from './ShortcutKbd.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/PillButton',
  component: PillButton,
};

export default meta;

export const Default = fromTemplate(
  { PillButton, ShortcutKbd },
  `
  <div class="sb-row">
    <pill-button>Style this page</pill-button>
    <pill-button>
      Style this page
      <template #trailing><shortcut-kbd small value="alt+shift+m" /></template>
    </pill-button>
  </div>
`
);
