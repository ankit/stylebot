import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import ThePosition from './ThePosition.vue';
import { positionCard } from '@stylebot/storybook/fixtures/options';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Position',
  tags: ['test'],
  component: ThePosition,
};

export default meta;

export const SavesDockLocation: StoryObj = {
  ...positionCard({}, async (root, store) => {
    const card = within(root);

    for (const [item, dockLocation] of [
      ['Window', 'window'],
      ['Left', 'left'],
      ['Right', 'right'],
      ['Side panel', 'sidepanel'],
    ] as const) {
      await user.click(card.getByRole('button', { name: item }));

      await waitFor(() =>
        expect(store.state.options?.layout.dockLocation).toBe(dockLocation)
      );
      await expect(card.getByRole('button', { name: item })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(store.state.options?.layout.width).toBe(360);
    }
  }),
  name: 'the Position row saves where the editor opens, keeping the rest of the layout',
};
