import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

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

export const AsksForSidePanel: StoryObj = {
  ...positionCard({}, async (root, store) => {
    // As before the first grant: Chrome only adds the API with the permission.
    delete (chrome as Partial<typeof chrome>).sidePanel;
    const request = spyOn(chrome.permissions, 'request');

    await user.click(within(root).getByRole('button', { name: 'Side panel' }));

    await expect(request).toHaveBeenCalledWith(
      { permissions: ['sidePanel'] },
      expect.any(Function)
    );
    await expect(store.state.options?.layout.dockLocation).toBe('sidepanel');
  }),
  // Refused, as a grant would outlast the story in this page's modules.
  parameters: { chrome: { permissions: { allowRequest: false } } },
  name: 'picking the side panel asks for its permission',
};

export const KeepsSidePanelPermission: StoryObj = {
  ...positionCard({}, async root => {
    const request = spyOn(chrome.permissions, 'request');
    const card = within(root);

    await user.click(card.getByRole('button', { name: 'Side panel' }));

    await expect(
      card.getByRole('button', { name: 'Side panel' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(request).not.toHaveBeenCalled();
  }),
  name: 'picking the side panel with its permission asks for nothing',
};
