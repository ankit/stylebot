import type { Meta } from '@storybook/vue';

import ConfirmDialog from './ConfirmDialog.vue';
import { playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { padded: false },
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
  },
  args: {
    title: 'Delete all styles?',
    message: "This removes every saved style. This can't be undone.",
    confirmLabel: 'Delete all',
    cancelLabel: 'Cancel',
  },
};

export default meta;

export const Playground = playground(
  { ConfirmDialog },
  `
  <div style="height: 100vh">
    <confirm-dialog
      :title="title"
      :message="message"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
    />
  </div>
`
);
