import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheStylesTab from './TheStylesTab.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Styles',
  tags: ['test'],
  component: TheStylesTab,
  parameters: { padded: false },
};

export default meta;

/**
 * Opens a new style and types its URL.
 */
const addStyleFor = async (root: HTMLElement, url: string): Promise<void> => {
  const canvas = within(root);

  await user.click(canvas.getByRole('button', { name: 'Add a style' }));
  await user.type(canvas.getByPlaceholderText('example.com'), url);
};

export const SavingOverAnExistingStyleAsksFirst: StoryObj = {
  ...optionsPage('Styles', { styles: seededStyles }, async root => {
    const canvas = within(root);

    await addStyleFor(root, 'example.com');
    await user.click(canvas.getByRole('button', { name: 'Save' }));

    await expect(
      canvas.getByText(
        'A style for example.com already exists. Saving will replace it.'
      )
    ).toBeVisible();

    await user.click(canvas.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(canvas.queryByText(/already exists/)).not.toBeInTheDocument()
    );
    await expect(root.querySelector('.editor-page')).toBeVisible();
  }),
  name: 'saving a new style for a URL that already has one asks before replacing it',
};

export const SavingANewUrlDoesNotAsk: StoryObj = {
  ...optionsPage('Styles', { styles: seededStyles }, async root => {
    const canvas = within(root);

    await addStyleFor(root, 'another.example.com');
    await user.click(canvas.getByRole('button', { name: 'Save' }));

    await expect(canvas.queryByText(/already exists/)).not.toBeInTheDocument();
  }),
  name: 'saving a style for a URL with no style saves without asking',
};
