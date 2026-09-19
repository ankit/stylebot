import type { Meta } from '@storybook/vue';

import ShortcutRecorderField from './ShortcutRecorderField.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/ShortcutRecorderField',
  component: ShortcutRecorderField,
};

export default meta;

export const States = fromTemplate(
  { ShortcutRecorderField },
  `
  <div class="sb-stack">
    <shortcut-recorder-field value="" />
    <shortcut-recorder-field value="alt+shift+t" />
  </div>
`
);

export const Recording = fromTemplate(
  { ShortcutRecorderField },
  `<shortcut-recorder-field value="" />`,
  {
    play: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('.record-btn')?.click();
    },
  }
);
