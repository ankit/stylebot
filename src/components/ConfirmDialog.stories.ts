import type { Meta } from '@storybook/vue';

import ConfirmDialog from './ConfirmDialog.vue';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { padded: false },
};

export default meta;

export const Default = fromTemplate(
  { ConfirmDialog },
  `
  <div style="height: 100vh">
    <confirm-dialog
      title="Delete all styles?"
      message="This removes every saved style. This can't be undone."
      confirm-label="Delete all"
    />
  </div>
`
);
