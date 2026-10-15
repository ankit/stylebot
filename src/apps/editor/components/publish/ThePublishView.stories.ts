import type { Meta } from '@storybook/vue';

import ThePublishView from './ThePublishView.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';

const meta: Meta = {
  title: 'Editor/Publish',
  component: ThePublishView,
  parameters: { padded: false },
};

export default meta;

export const SignedOut = {
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: { chrome: { gallery: {} } },
};

export const SignedIn = {
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: { chrome: { gallery: { account: { id: 'me', name: 'maya' } } } },
};
