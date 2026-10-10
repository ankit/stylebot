import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheTheme from './TheTheme.vue';
import { optionsPage } from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Theme',
  tags: ['test'],
  component: TheTheme,
  parameters: { padded: false },
};

export default meta;

export const SwitchesTheme: StoryObj = {
  ...optionsPage('Basics', {}, async root => {
    const card = within(
      within(root)
        .getByRole('heading', { name: 'Theme' })
        .closest('.list-item') as HTMLElement
    );
    const app = root.querySelector('.options-app') as HTMLElement;

    for (const [item, appearance] of [
      ['Dark', 'dark'],
      ['Light', 'light'],
      ['System', 'system'],
    ] as const) {
      await user.click(card.getByRole('button', { name: item }));

      await expect(card.getByRole('button', { name: item })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      // System follows the OS, so the provider sets no theme of its own.
      await waitFor(() =>
        appearance === 'system'
          ? expect(app).not.toHaveAttribute('data-theme')
          : expect(app).toHaveAttribute('data-theme', appearance)
      );
    }
  }),
  name: 'the Theme row switches the options page between light, dark and system',
};
