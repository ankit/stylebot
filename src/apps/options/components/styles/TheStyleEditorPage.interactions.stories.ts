import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import type Vue from 'vue';
import type { Store } from 'vuex';
import type { OptionsState } from '@stylebot/storybook/fixtures/options-store';
import TheStyleEditorPage from './TheStyleEditorPage.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Options/Profiles',
  tags: ['test'],
  component: TheStyleEditorPage,
  parameters: { padded: false },
};

export default meta;

const URL = 'reader.example.org';

const optionsStore = (root: HTMLElement) =>
  (root.querySelector('.editor-page') as unknown as { __vue__: Vue }).__vue__
    .$store as Store<OptionsState>;

/**
 * Stands in for typing in the code editor: its iframe reports edits to the
 * page with this message.
 */
const editCss = async (css: string) => {
  window.postMessage({ type: 'stylebotMonacoIframeCssUpdated', css }, '*');
  await new Promise(resolve => setTimeout(resolve, 50));
};

/**
 * Opens the seeded style that has a Default and a Night profile.
 */
const openProfiledStyle = async (root: HTMLElement) => {
  const row = Array.from(root.querySelectorAll<HTMLElement>('.list-item')).find(
    el => el.textContent?.includes(URL)
  ) as HTMLElement;

  await user.click(row.querySelector('.title') as HTMLElement);
  await waitFor(() => expect(root.querySelector('.editor-page')).toBeVisible());
};

const stylesTab = optionsPage('Styles', { styles: seededStyles });
const profiledStyleEditor = optionsPage(
  'Styles',
  { styles: seededStyles },
  openProfiledStyle
);

export const CountInList: StoryObj = {
  ...stylesTab,
  name: 'the styles list says how many profiles a style has, and the row opens its editor',
  play: async context => {
    await stylesTab.play?.(context);
    const { canvasElement } = context;

    const row = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.list-item')
    ).find(el => el.textContent?.includes(URL)) as HTMLElement;

    await expect(within(row).getByText(/2 profiles/)).toBeVisible();
    await expect(
      within(row).queryByRole('button', { name: 'Edit' })
    ).toBeNull();

    await user.click(row.querySelector('.title') as HTMLElement);
    await waitFor(() =>
      expect(canvasElement.querySelector('.editor-page')).toBeVisible()
    );
  },
};

export const EditInactiveProfile: StoryObj = {
  ...profiledStyleEditor,
  name: 'a profile tab edits that profile without making it active, and Save keeps every edit',
  play: async context => {
    await profiledStyleEditor.play?.(context);
    const { canvasElement, step } = context;

    const canvas = within(canvasElement);
    const store = optionsStore(canvasElement);

    await step('the active profile is marked and selected', async () => {
      const active = canvas.getByRole('tab', { name: /^Default/ });
      await expect(active).toHaveAttribute('aria-selected', 'true');
    });

    await step('edits to two profiles survive switching tabs', async () => {
      await editCss('body { max-width: 720px; }');
      await user.click(canvas.getByRole('tab', { name: 'Night' }));
      await editCss('body { background: #000; }');
      await user.click(canvas.getByRole('tab', { name: /^Default/ }));

      await expect(store.state.styles[URL].profiles?.night.css).toBe(
        'body { background: #111; }'
      );
    });

    await step('Save writes both, leaving Default active', async () => {
      await user.click(canvas.getByRole('button', { name: 'Save' }));

      await expect(store.state.styles[URL]).toMatchObject({
        css: 'body { max-width: 720px; }',
        activeProfile: 'default',
        profiles: { night: { css: 'body { background: #000; }' } },
      });
    });
  },
};

export const UseAndCreateProfile: StoryObj = {
  ...profiledStyleEditor,
  name: 'Use this profile activates the selected tab, and Create profile adds and selects one',
  play: async context => {
    await profiledStyleEditor.play?.(context);
    const { canvasElement, step } = context;

    const canvas = within(canvasElement);
    const store = optionsStore(canvasElement);

    await step('Night becomes the applied profile', async () => {
      await user.click(canvas.getByRole('tab', { name: 'Night' }));
      await user.click(canvas.getByRole('button', { name: 'Profile actions' }));
      const menu = await findOpenMenu(canvas);
      await user.click(
        within(menu).getByRole('menuitem', { name: 'Use this profile' })
      );

      await expect(store.state.styles[URL]).toMatchObject({
        css: 'body { background: #111; }',
        activeProfile: 'night',
      });
      await expect(
        canvas.getByRole('tab', { name: 'Night Active' })
      ).toBeVisible();
    });

    await step('a new profile is added and selected', async () => {
      await user.click(canvas.getByRole('button', { name: 'Create profile' }));
      const dialog = await canvas.findByRole('dialog');
      await user.type(
        within(dialog).getByRole('textbox', { name: 'Profile name' }),
        'Print{Enter}'
      );

      const tab = await canvas.findByRole('tab', { name: 'Print' });
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(
        Object.values(store.state.styles[URL].profiles ?? {}).map(
          profile => profile.name
        )
      ).toEqual(['', 'Night', 'Print']);
    });
  },
};
