import type { Meta } from '@storybook/vue';

import SDialog from './SDialog.vue';
import SCard from './SCard.vue';
import Heading from './Heading.vue';
import SText from './SText.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/SDialog',
  component: SDialog,
  parameters: { padded: false },
};

export default meta;

export const Default = fromTemplate(
  { SDialog, SCard, Heading, SText },
  `
  <div style="height: 100vh">
    <s-dialog>
      <s-card style="width: 320px; padding: 20px">
        <heading as="h2" size="md">Dialog title</heading>
        <s-text size="caption" variant="muted">Content rendered over the backdrop.</s-text>
      </s-card>
    </s-dialog>
  </div>
`
);
