import type { Meta } from '@storybook/vue';

import TheStylesTab from './TheStylesTab.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/mocks/options-page';
import { expect, userEvent } from '@storybook/test';

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
    const edit = Array.from(
      root.querySelectorAll<HTMLElement>('.row button')
    ).find(button => button.textContent?.trim() === 'Edit');
    await userEvent.click(edit as HTMLElement);
    await expect(root.querySelector('.editor-page')).toBeVisible();
  }
);
