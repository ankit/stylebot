import type { Meta } from '@storybook/vue';

import SLinkButton from './SLinkButton.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SLinkButton',
  component: SLinkButton,
  argTypes: { label: { control: 'text' } },
  args: { label: 'View' },
};

export default meta;

const components = { SLinkButton };

export const Playground = playground(
  components,
  `<s-link-button>{{ label }}</s-link-button>`
);

export const InContext = fromTemplate(
  components,
  `
  <div class="sb-row">
    <span>Saved to Google Drive</span>
    <s-link-button>Disconnect</s-link-button>
  </div>
`
);
