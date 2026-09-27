import type { Meta } from '@storybook/vue';

import SPillButton from './SPillButton.vue';
import SShortcutKbd from './SShortcutKbd.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SPillButton',
  component: SPillButton,
  argTypes: {
    label: { control: 'text' },
    shortcut: { control: 'text' },
  },
  args: { label: 'Style this page', shortcut: 'alt+shift+m' },
};

export default meta;

const components = { SPillButton, SShortcutKbd };

export const Playground = playground(
  components,
  `
  <s-pill-button>
    {{ label }}
    <template v-if="shortcut" #trailing>
      <s-shortcut-kbd small :value="shortcut" />
    </template>
  </s-pill-button>
`
);

export const Variants = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-pill-button>Manage all styles</s-pill-button>
    <s-pill-button>
      Style this page
      <template #trailing><s-shortcut-kbd small value="alt+shift+m" /></template>
    </s-pill-button>
  </div>
`
);
