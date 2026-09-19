import type { Meta, StoryObj } from '@storybook/vue';

import SButton from './SButton.vue';
import { ChevronDownIcon } from '@stylebot/icons';
import { fromTemplate } from '../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SButton',
  component: SButton,
};

export default meta;

const components = { SButton, ChevronDownIcon };

const row = (buttons: string): StoryObj =>
  fromTemplate(components, `<div class="sb-row">${buttons}</div>`);

export const Default = row(`
  <s-button>Save</s-button>
  <s-button disabled>Save</s-button>
`);

export const Ghost = row(`
  <s-button variant="ghost">Cancel</s-button>
  <s-button variant="ghost" disabled>Cancel</s-button>
`);

export const Danger = row(`
  <s-button variant="danger">Delete</s-button>
  <s-button variant="danger" disabled>Delete</s-button>
`);

export const WithTrailing = row(`
  <s-button>
    Options
    <template #trailing><chevron-down-icon :size="14" /></template>
  </s-button>
`);
