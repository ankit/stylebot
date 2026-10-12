import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheChatOption from './TheChatOption.vue';
import { optionsPage } from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Chat',
  tags: ['test'],
  component: TheChatOption,
  parameters: { padded: false },
};

export default meta;

export const TurnsChatOn: StoryObj = {
  ...optionsPage('Basics', {}, async root => {
    const row = within(
      within(root)
        .getByRole('heading', { name: 'Chat' })
        .closest('.list-item') as HTMLElement
    );
    const toggle = row.getByRole('checkbox', { name: 'Chat' });

    await expect(toggle).not.toBeChecked();

    await user.click(row.getByText(/Adds a Chat tab/));
    await waitFor(() => expect(toggle).toBeChecked());
  }),
  name: 'Chat is off by default and the row turns it on',
};
