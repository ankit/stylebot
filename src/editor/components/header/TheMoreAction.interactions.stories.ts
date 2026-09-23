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

const caption = (toggle: HTMLElement) =>
  toggle.closest('.push-page-row')?.querySelector('.push-page-copy')
    ?.textContent ?? '';

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
      await expect(caption(toggle)).toContain(
        'Every rule gets !important, so your styles win.'
      );
      await expect(
        within(menu).getByText('!important', { selector: 'code' })
      ).toBeVisible();
      await user.click(toggle);

      await expect(store.state.forceImportant).toBe(false);
      await expect(toggle).not.toBeChecked();
      await expect(caption(toggle)).toContain(
        "Your CSS is applied as written. Some rules may lose to the site's own styles."
      );
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
  },
};
