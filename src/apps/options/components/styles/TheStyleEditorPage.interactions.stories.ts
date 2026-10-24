import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import type Vue from 'vue';
import type { Store } from 'vuex';
import type { OptionsState } from '@stylebot/storybook/fixtures/options-store';
import TheStyleEditorPage from './TheStyleEditorPage.vue';
import {
  optionsPage,
  seededStyles,
} from '@stylebot/storybook/fixtures/options';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';
import { isMac } from '@stylebot/utils';
import { getGalleryEditUrl, hashCss } from '@stylebot/gallery';
import { gallerySuggestions } from '@stylebot/storybook/fixtures/popup';

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

export const TabsDoNotScrollVertically: StoryObj = {
  ...profiledStyleEditor,
  name: 'the profile tabs fit their bar, with no vertical scrollbar, and the selected one underlines its edge',
  play: async context => {
    await profiledStyleEditor.play?.(context);
    const { canvasElement } = context;

    const bar = canvasElement.querySelector('.profile-bar') as HTMLElement;
    const tabs = canvasElement.querySelector('.profile-tabs') as HTMLElement;
    const selected = canvasElement.querySelector(
      '.profile-tab.selected'
    ) as HTMLElement;

    await expect(tabs.scrollHeight).toBeLessThanOrEqual(tabs.clientHeight);
    await expect(tabs.offsetWidth).toBe(tabs.clientWidth);
    await expect(
      selected.getBoundingClientRect().bottom
    ).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom);
  },
};

const publishedStyles = {
  ...seededStyles,
  [URL]: {
    ...seededStyles[URL],
    profiles: {
      default: {
        name: '',
        galleryListing: {
          styleId: 1,
          slug: 'reader',
          version: 1,
          cssHash: hashCss('body { max-width: 680px; }'),
          published: true,
        },
      },
      night: {
        name: 'Night',
        css: 'body { background: #111; }',
        galleryListing: {
          styleId: 2,
          slug: 'night',
          version: 1,
          cssHash: 'stale',
          published: true,
        },
      },
    },
  },
};

const publishedStyleEditor = optionsPage(
  'Styles',
  { styles: publishedStyles },
  openProfiledStyle
);

export const GalleryLine: StoryObj = {
  ...publishedStyleEditor,
  name: "a published profile's Gallery line says Published with Manage, or Unpublished changes with Publish, which publishes without a tab to capture",
  play: async context => {
    await publishedStyleEditor.play?.(context);
    const canvas = within(context.canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await expect(await canvas.findByText('Published')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Manage' })).toHaveAttribute(
      'href',
      getGalleryEditUrl(1)
    );

    await user.click(canvas.getByRole('tab', { name: /Night/ }));
    await expect(await canvas.findByText('Unpublished changes')).toBeVisible();

    await user.click(canvas.getByRole('button', { name: 'Publish' }));
    await expect(sent).toHaveBeenCalledWith({
      name: 'PublishProfileToGallery',
      url: URL,
      profileId: 'night',
    });
  },
};

/**
 * The seeded styles with the Night profile installed from the Gallery, with
 * a hash of the css it was installed with.
 */
const installedStyles = (cssHash: string) => ({
  ...seededStyles,
  [URL]: {
    ...seededStyles[URL],
    profiles: {
      ...seededStyles[URL].profiles,
      night: {
        ...seededStyles[URL].profiles.night,
        galleryListing: {
          styleId: 1,
          slug: 'tokyo-night',
          version: 1,
          cssHash,
          published: false,
        },
      },
    },
  },
});

const installedStyleEditor = optionsPage(
  'Styles',
  { styles: installedStyles(hashCss(seededStyles[URL].profiles.night.css)) },
  openProfiledStyle
);

const editedInstallEditor = optionsPage(
  'Styles',
  { styles: installedStyles('stale') },
  openProfiledStyle
);

export const InstalledGalleryLine: StoryObj = {
  ...installedStyleEditor,
  parameters: {
    ...installedStyleEditor.parameters,
    chrome: { gallery: { suggestions: gallerySuggestions } },
  },
  name: 'a profile installed from the Gallery names its author on its Gallery line, with View in Gallery opening its page',
  play: async context => {
    await installedStyleEditor.play?.(context);
    const canvas = within(context.canvasElement);

    await user.click(canvas.getByRole('tab', { name: /Night/ }));
    await expect(
      await canvas.findByText('Gallery style by maya')
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'View in Gallery' })
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/\/style\/1\/tokyo-night$/)
    );
  },
};

export const EditedInstallGalleryLine: StoryObj = {
  ...editedInstallEditor,
  parameters: {
    ...editedInstallEditor.parameters,
    chrome: { gallery: { suggestions: gallerySuggestions } },
  },
  name: "a profile edited since it was installed from the Gallery says it's the user's edit of the author's style, with View in Gallery",
  play: async context => {
    await editedInstallEditor.play?.(context);
    const canvas = within(context.canvasElement);

    await user.click(canvas.getByRole('tab', { name: /Night/ }));
    await expect(
      await canvas.findByText("Your edit of maya's style")
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'View in Gallery' })
    ).toBeVisible();
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

    await step('the editor stays open with nothing left unsaved', async () => {
      await expect(canvas.getByRole('tab', { name: /^Default/ })).toBeVisible();
      await expect(canvas.queryByText('Unsaved changes')).toBeNull();
      await expect(canvas.getByText('Saved')).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled();
      await waitFor(() => expect(canvas.queryByText('Saved')).toBeNull(), {
        timeout: 3000,
      });
    });
  },
};

export const SaveShortcut: StoryObj = {
  ...profiledStyleEditor,
  name: 'Ctrl+S saves like the Save button, from the page or the code editor',
  play: async context => {
    await profiledStyleEditor.play?.(context);
    const { canvasElement, step } = context;

    const canvas = within(canvasElement);
    const store = optionsStore(canvasElement);

    await step('Ctrl+S in the URL field saves the edit', async () => {
      await editCss('body { max-width: 640px; }');
      await user.click(canvas.getByPlaceholderText('example.com'));
      await user.keyboard(
        isMac() ? '{Meta>}s{/Meta}' : '{Control>}s{/Control}'
      );

      await waitFor(() =>
        expect(store.state.styles[URL].css).toBe('body { max-width: 640px; }')
      );
    });

    await step('Ctrl+S in the code editor saves the edit', async () => {
      await editCss('body { max-width: 600px; }');
      window.postMessage({ type: 'stylebotSavePressed' }, '*');

      await waitFor(() =>
        expect(store.state.styles[URL].css).toBe('body { max-width: 600px; }')
      );
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
