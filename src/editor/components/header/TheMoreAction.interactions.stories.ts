import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheMoreAction from './TheMoreAction.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  openEditorMenu,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Override site styles',
  tags: ['test'],
  component: TheMoreAction,
  parameters: { padded: false },
};

export default meta;

const injectedCss = (url: string) =>
  document.getElementById(`stylebot-css-${url}`)?.textContent ?? '';

const settingRow = (toggle: HTMLElement) =>
  toggle.closest('.setting-row') as HTMLElement;

const caption = (toggle: HTMLElement) =>
  settingRow(toggle).querySelector('.setting-copy')?.textContent ?? '';

export const ToggleForceImportant: StoryObj = {
  ...editor(WITH_RULE),
  name: 'turning Override site styles off applies the style as written, and back on forces it',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const url = store.state.url;

    await step('the style starts out forced', async () => {
      await waitFor(() =>
        expect(injectedCss(url)).toContain('color: #2a5fd6 !important')
      );
    });

    await step('switching it off reapplies the css as written', async () => {
      const menu = await openEditorMenu(canvas, 'Options');
      const toggle = within(menu).getByRole('checkbox', {
        name: 'Override site styles',
      });

      await expect(toggle).toBeChecked();
      await expect(caption(toggle)).toContain('Every rule gets !important');
      await expect(
        within(menu).getByText('!important', { selector: 'code' })
      ).toBeVisible();
      await user.click(toggle);

      await expect(store.state.forceImportant).toBe(false);
      await expect(toggle).not.toBeChecked();
      await expect(caption(toggle)).toContain('Rules apply as written');
      await waitFor(() =>
        expect(injectedCss(url)).toContain('color: #2a5fd6;')
      );
      await expect(injectedCss(url)).not.toContain('!important');
    });

    await step('switching it back on forces it again', async () => {
      const menu = canvas.getByRole('menu');
      await user.click(
        within(menu).getByRole('checkbox', { name: 'Override site styles' })
      );

      await expect(store.state.forceImportant).toBe(true);
      await waitFor(() =>
        expect(injectedCss(url)).toContain('color: #2a5fd6 !important')
      );
    });

    await step('the row itself toggles, not just the switch', async () => {
      const menu = canvas.getByRole('menu');
      const toggle = within(menu).getByRole('checkbox', {
        name: 'Override site styles',
      });

      await user.click(
        settingRow(toggle).querySelector('.setting-copy') as HTMLElement
      );

      await expect(store.state.forceImportant).toBe(false);
      await waitFor(() => expect(injectedCss(url)).not.toContain('!important'));
    });
  },
};
