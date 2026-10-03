import type { Meta } from '@storybook/vue';

import SDialogCard from './SDialogCard.vue';
import SButton from './SButton.vue';
import SText from './SText.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SDialogCard',
  component: SDialogCard,
};

export default meta;

export const Default = fromTemplate(
  { SDialogCard, SButton, SText },
  `
  <s-dialog-card title="Dialog title" role="dialog">
    <s-text variant="muted" style="margin: 8px 0 20px">
      The card SConfirmDialog and SPromptDialog are built on.
    </s-text>

    <template #actions>
      <s-button variant="ghost">Cancel</s-button>
      <s-button variant="primary">Done</s-button>
    </template>
  </s-dialog-card>
`
);
