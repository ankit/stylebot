import type { Meta } from '@storybook/vue';

import PillButton from './PillButton.vue';
import ShortcutKbd from './ShortcutKbd.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/PillButton',
  component: PillButton,
  argTypes: {
    label: { control: 'text' },
    shortcut: { control: 'text' },
  },
  args: { label: 'Style this page', shortcut: 'alt+shift+m' },
};

export default meta;

const components = { PillButton, ShortcutKbd };

export const Playground = playground(
  components,
  `
  <pill-button>
    {{ label }}
    <template v-if="shortcut" #trailing>
      <shortcut-kbd small :value="shortcut" />
    </template>
  </pill-button>
`
);

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-row">
    <pill-button>Manage all styles</pill-button>
    <pill-button>
      Style this page
      <template #trailing><shortcut-kbd small value="alt+shift+m" /></template>
    </pill-button>
  </div>
`
);
