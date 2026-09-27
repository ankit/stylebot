import type { Meta } from '@storybook/vue';

import SConfirmDialog from './SConfirmDialog.vue';
import { playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SConfirmDialog',
  component: SConfirmDialog,
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
  { SConfirmDialog },
  `
  <div style="height: 100vh">
    <s-confirm-dialog
      :title="title"
      :message="message"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
    />
  </div>
`
);
