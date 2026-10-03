import type { Meta } from '@storybook/vue';

import SPromptDialog from './SPromptDialog.vue';
import { playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SPromptDialog',
  component: SPromptDialog,
  parameters: { padded: false },
  argTypes: {
    title: { control: 'text' },
    label: { control: 'text' },
    value: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
  },
  args: {
    title: 'Rename profile',
    label: 'Profile name',
    value: 'Dark',
    confirmLabel: 'Rename',
    cancelLabel: 'Cancel',
  },
};

export default meta;

export const Playground = playground(
  { SPromptDialog },
  `
  <div style="height: 100vh">
    <s-prompt-dialog
      :title="title"
      :label="label"
      :value="value"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
      :validate="text => text === 'Taken' ? 'A profile with this name already exists' : ''"
    />
  </div>
`
);
