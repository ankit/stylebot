import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, within } from '@storybook/test';

import { popup, profiledStyle } from '@stylebot/storybook/fixtures/popup';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Touch',
  tags: ['test'],
  parameters: { padded: false, touchscreen: true },
};

export default meta;

const twoProfiles = popup({
  styles: [profiledStyle('example.com')],
  defaultStyle: profiledStyle('example.com'),
});

const IPHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1';

const phonePopup: StoryObj = {
  ...twoProfiles,
  render: () => ({
    ...(twoProfiles.render as () => Record<string, unknown>)(),
    template: '<app />',
  }),
};

export const FillsPhone: StoryObj = {
  ...phonePopup,
  name: 'on a phone the popup fills the sheet and shows each profile’s actions without hover',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const popupRoot = canvasElement.querySelector('.popup') as HTMLElement;

    await canvas.findByRole('radio', { name: 'Default' });

    await expect(popupRoot.getBoundingClientRect().width).toBeGreaterThan(
      window.innerWidth - 2
    );

    const actions = canvas.getAllByRole('button', { name: 'Profile actions' });

    await expect(actions).toHaveLength(2);

    for (const button of actions) {
      await expect(getComputedStyle(button).opacity).toBe('1');
      await expect(
        button.getBoundingClientRect().height
      ).toBeGreaterThanOrEqual(32);
    }

    const row = canvas.getByRole('radio', { name: 'Dark' });

    await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

export const NoEditorOnIPhone: StoryObj = {
  ...phonePopup,
  // Before render, since the popup reads it once as it starts.
  loaders: [
    () => {
      spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_USER_AGENT);
    },
  ],
  name: 'on iPhone the popup offers no way into the editor: no Edit button, Edit item or Create profile',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('radio', { name: 'Default' });

    await expect(
      canvas.queryByRole('button', { name: /^Edit Default/ })
    ).toBeNull();
    await expect(
      canvas.queryByRole('button', { name: 'Create profile' })
    ).toBeNull();

    const row = canvas.getByRole('radio', { name: 'Dark' }).parentElement!;

    await user.click(
      within(row).getByRole('button', { name: 'Profile actions' })
    );

    const menu = await findOpenMenu(within(row));

    await expect(
      within(menu).getByRole('menuitem', { name: 'Rename' })
    ).toBeInTheDocument();
    await expect(
      within(menu).queryByRole('menuitem', { name: 'Edit' })
    ).toBeNull();
  },
};
