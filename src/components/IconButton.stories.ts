import type { Meta } from '@storybook/vue';

import IconButton from './IconButton.vue';
import { MoreIcon, SunIcon, IconX } from '@stylebot/icons';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
};

export default meta;

const components = { IconButton, MoreIcon, SunIcon, IconX };

export const Default = fromTemplate(
  components,
  `
  <div class="sb-row">
    <icon-button title="More"><more-icon :size="16" /></icon-button>
    <icon-button title="Appearance"><sun-icon :size="16" /></icon-button>
    <icon-button title="Close"><icon-x :size="22" /></icon-button>
  </div>
`
);

export const Bordered = fromTemplate(
  components,
  `
  <div class="sb-row">
    <icon-button bordered title="More"><more-icon :size="16" /></icon-button>
    <icon-button bordered :size="26" title="More"><more-icon :size="14" /></icon-button>
  </div>
`
);
