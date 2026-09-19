import type { Meta } from '@storybook/vue';

import ToggleSwitch from './ToggleSwitch.vue';
import ShortcutKbd from './ShortcutKbd.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/ToggleSwitch',
  component: ToggleSwitch,
};

export default meta;

const components = { ToggleSwitch, ShortcutKbd };

export const Small = fromTemplate(
  components,
  `
  <div class="sb-stack">
    <toggle-switch :value="false">Off</toggle-switch>
    <toggle-switch :value="true">On</toggle-switch>
    <toggle-switch :value="false" disabled>Disabled off</toggle-switch>
    <toggle-switch :value="true" disabled>Disabled on</toggle-switch>
  </div>
`
);

export const Large = fromTemplate(
  components,
  `
  <div class="sb-stack">
    <toggle-switch size="lg" :value="false">Off</toggle-switch>
    <toggle-switch size="lg" :value="true">On</toggle-switch>
  </div>
`
);

export const WithTrailing = fromTemplate(
  components,
  `
  <toggle-switch :value="true">
    Reader mode
    <template #trailing><shortcut-kbd small value="alt+shift+r" /></template>
  </toggle-switch>
`
);
