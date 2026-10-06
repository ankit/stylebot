import type { Meta } from '@storybook/vue';

import RatingPrompt from './RatingPrompt.vue';
import { popup, ratingEligible } from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Rating Prompt',
  component: RatingPrompt,
  parameters: { padded: false },
};

export default meta;

export const Eligible = popup(ratingEligible());
