import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, within } from '@storybook/test';

import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import {
  findOpenMenu,
  hasTouchTarget,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Touch',
  tags: ['test'],
  parameters: { padded: false, touchscreen: true },
};

export default meta;

const IPHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1';

// Before render, since the page reads it once as it starts.
const onIPhone = [
  (): void => {
    spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_USER_AGENT);
  },
];

/**
 * The Styles list row for a site.
 */
const rowFor = (root: HTMLElement, url: string): HTMLElement =>
  within(root).getAllByText(url)[0].closest('.list-item') as HTMLElement;

export const TabsAcrossTheTop: StoryObj = {
  ...optionsPage('Styles', { styles: seededStyles }, async root => {
    const tabs = Array.from(root.querySelectorAll<HTMLElement>('.nav-item'));
    const tops = new Set(tabs.map(tab => tab.getBoundingClientRect().top));

    await expect(tops.size).toBe(1);

    for (const tab of tabs) {
      await expect(hasTouchTarget(tab)).toBe(true);
    }

    const content = root.querySelector('.content') as HTMLElement;

    await expect(content.getBoundingClientRect().width).toBeGreaterThan(
      window.innerWidth - 2
    );

    const row = rowFor(root, 'example.com');
    const menu = within(row).getByRole('button', {
      name: 'More actions',
    });

    await expect(hasTouchTarget(menu)).toBe(true);
  }),
  name: 'on a phone the sections become a row of tabs above full-width content, with 44pt targets',
};

export const NoEditorSettingsOnIPhone: StoryObj = {
  ...optionsPage('Basics'),
  loaders: onIPhone,
  name: 'on iPhone Basics leaves out the theme, editor position, right-click menu and keyboard shortcuts',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Gallery suggestions');

    await expect(canvas.queryByText('Theme')).toBeNull();
    await expect(canvas.queryByText('Editor position')).toBeNull();
    await expect(canvas.queryByText('Right-click menu')).toBeNull();
    await expect(canvas.queryByText('Keyboard shortcuts')).toBeNull();
  },
};

export const NoCssEditingOnIPhone: StoryObj = {
  ...optionsPage('Styles', { styles: seededStyles }, async root => {
    const canvas = within(root);

    await expect(
      canvas.queryByRole('button', { name: 'Add a style' })
    ).toBeNull();
    await expect(
      within(root.querySelector('.list') as HTMLElement).queryByRole('link')
    ).toBeNull();

    const row = rowFor(root, 'example.com');
    const rowCanvas = within(row);

    const toggle = rowCanvas.getByRole('checkbox').closest('label');

    await expect(hasTouchTarget(toggle as HTMLElement)).toBe(true);

    await user.click(rowCanvas.getByRole('button', { name: 'More actions' }));

    const menu = await findOpenMenu(rowCanvas);

    await expect(
      within(menu).getByRole('menuitem', { name: 'Delete' })
    ).toBeInTheDocument();
    await expect(
      within(menu).queryByRole('menuitem', { name: 'Edit' })
    ).toBeNull();
  }),
  loaders: onIPhone,
  name: 'on iPhone Styles lists, toggles and deletes styles but offers no way to edit their CSS',
};
