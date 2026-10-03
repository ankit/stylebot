import type { Meta } from '@storybook/vue';

import TheStylesTab from './TheStylesTab.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';
import { expect } from '@storybook/test';

const meta: Meta = {
  title: 'Options/Styles',
  component: TheStylesTab,
  parameters: { padded: false },
};

export default meta;

export const List = optionsPage('Styles', { styles: seededStyles });

export const Empty = optionsPage('Styles');

export const Editor = optionsPage(
  'Styles',
  { styles: seededStyles },
  async root => {
    await user.click(root.querySelector('.row .domain') as HTMLElement);
    await expect(root.querySelector('.editor-page')).toBeVisible();
  }
);
