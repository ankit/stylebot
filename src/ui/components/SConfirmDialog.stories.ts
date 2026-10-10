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

export const Contained = playground(
  { SConfirmDialog },
  `
  <div style="position: relative; width: 396px; height: 600px; border: 1px solid var(--panel-border); border-radius: 14px">
    <s-confirm-dialog
      contained
      size="small"
      :title="title"
      :message="message"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
    />
  </div>
`
);
