import type { Meta } from '@storybook/vue';
import { expect } from '@storybook/test';

import SShortcutRecorderField from './SShortcutRecorderField.vue';
import {
  fromTemplate,
  playground,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Inputs/SShortcutRecorderField',
  component: SShortcutRecorderField,
  argTypes: { value: { control: 'text' } },
  args: { value: 'alt+shift+t' },
};

export default meta;

const components = { SShortcutRecorderField };

export const Playground = playground(
  components,
  `<s-shortcut-recorder-field :value="value" style="width: 260px" />`
);

export const States = fromTemplate(
  components,
  `
  <div class="sb-stack">
    <s-shortcut-recorder-field value="" style="width: 260px" />
    <s-shortcut-recorder-field value="alt+shift+t" style="width: 260px" />
  </div>
`
);

export const Recording = fromTemplate(
  components,
  `<s-shortcut-recorder-field value="" style="width: 260px" />`,
  {
    play: async ({ canvasElement }) => {
      await user.click(
        canvasElement.querySelector('.record-btn') as HTMLElement
      );
      await expect(
        canvasElement.querySelector('.field.recording')
      ).toBeVisible();
    },
  }
);
