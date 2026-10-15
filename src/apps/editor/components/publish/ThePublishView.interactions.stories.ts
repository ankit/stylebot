import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';
import { hashCss } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

import ThePublishView from './ThePublishView.vue';
import {
  editor,
  RULE_CSS,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
import type { GalleryShimOptions } from '@stylebot/storybook/mocks/chrome';
import {
  openEditorMenu,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Publish',
  tags: ['test'],
  component: ThePublishView,
  parameters: { padded: false },
};

export default meta;

const account = { id: 'me', name: 'maya' };

const tokyoNight: GalleryStyle = {
  id: 'Xk3p9QaL2m',
  site: 'example.com',
  group: 'example.com',
  slug: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'The Tokyo Night palette',
  author: account,
  version: 2,
  installs: 120,
  createdAt: 0,
  updatedAt: 0,
  screenshot: '/screenshots/Xk3p9QaL2m/2',
  status: 'live',
};

// Tokyo Night published from the seeded style, with the CSS it has now.
const publishedTokyoNight: GalleryShimOptions = {
  account,
  styles: [tokyoNight],
  published: {
    styleId: tokyoNight.id,
    version: tokyoNight.version,
    cssHash: hashCss(RULE_CSS),
    group: tokyoNight.group,
    slug: tokyoNight.slug,
  },
};

const publishView = (gallery: GalleryShimOptions = {}): StoryObj => ({
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: { chrome: { gallery } },
});

const publishButton = (
  canvas: ReturnType<typeof within>,
  name = 'Publish'
): HTMLElement => canvas.getByRole('button', { name });

const takeScreenshot = async (canvas: ReturnType<typeof within>) => {
  await user.click(
    await canvas.findByRole('button', { name: 'Take screenshot' })
  );
  await canvas.findByRole('img', { name: 'Screenshot' });
};

export const OpensFromTheMoreMenu: StoryObj = {
  ...editor(WITH_RULE),
  parameters: { chrome: { gallery: { account } } },
  name: 'Publish to Gallery in the ⋯ menu opens the publish view',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = within(await openEditorMenu(canvas, 'Options'));

    await user.click(
      menu.getByRole('menuitem', { name: 'Publish to Gallery' })
    );

    await canvas.findByRole('heading', { name: 'Publish to Gallery' });
    await expect(storeOf(canvasElement).state.publishing).toBe(true);
  },
};

export const SignsInThenPublishes: StoryObj = {
  ...publishView({
    publish: {
      ok: true,
      style: {
        ...tokyoNight,
        id: 'new-style',
        slug: 'night-reading',
        name: 'Night reading',
        version: 1,
        removed: ['@import url(https://example.com/theme.css);'],
      },
    },
  }),
  name: 'Signing in shows the form, and publishing lists what the Gallery took out',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sign in with Google', async () => {
      await user.click(
        await canvas.findByRole('button', { name: 'Sign in with Google' })
      );
      await canvas.findByLabelText('Name');
    });

    await step('publish waits for a screenshot and a name', async () => {
      await expect(publishButton(canvas)).toBeDisabled();

      await takeScreenshot(canvas);
      await user.type(canvas.getByLabelText('Name'), 'Night reading');
      await expect(publishButton(canvas)).toBeEnabled();
    });

    await step('publish', async () => {
      await user.click(publishButton(canvas));

      await canvas.findByText('Version 1 is live');
      await expect(
        canvas.getByRole('heading', { name: 'Night reading' })
      ).toBeVisible();
      await expect(
        canvas.getByText('@import url(https://example.com/theme.css);')
      ).toBeVisible();
    });

    await step('Done goes back to the editor', async () => {
      await user.click(canvas.getByRole('button', { name: 'Done' }));
      await waitFor(() =>
        expect(storeOf(canvasElement).state.publishing).toBe(false)
      );
    });
  },
};

export const UpdatesWhatWasPublished: StoryObj = {
  ...publishView(publishedTokyoNight),
  name: 'A published style is prefilled and publishes as a new version',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('the form is prefilled from the Gallery', async () => {
      await canvas.findByRole('heading', { name: 'Update Tokyo Night' });
      await waitFor(() =>
        expect(canvas.getByLabelText('Name')).toHaveValue('Tokyo Night')
      );
      await expect(canvas.getByText('Version 2 is live')).toBeVisible();
      await expect(publishButton(canvas, 'Publish update')).toBeDisabled();
    });

    await step('a new screenshot is enough to publish', async () => {
      await takeScreenshot(canvas);
      await user.click(publishButton(canvas, 'Publish update'));

      await canvas.findByText('Installed copies update within a day.');
    });
  },
};

export const ShowsTheServersReason: StoryObj = {
  ...publishView({
    account,
    publish: {
      ok: false,
      errorKey: 'gallery_error_invalid',
      errorDetail: 'The CSS is empty once sanitized.',
    },
  }),
  name: "A style the Gallery turns down shows the Gallery's own reason",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await takeScreenshot(canvas);
    await user.type(canvas.getByLabelText('Name'), 'Night reading');
    await user.click(publishButton(canvas));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'The CSS is empty once sanitized.'
    );
  },
};

export const Unpublishes: StoryObj = {
  ...publishView(publishedTokyoNight),
  name: 'Unpublishing asks first, then goes back to a first publish',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('heading', { name: 'Update Tokyo Night' });
    await user.click(canvas.getByRole('button', { name: 'More' }));
    await user.click(
      await canvas.findByRole('menuitem', { name: 'Unpublish' })
    );

    const dialog = within(await canvas.findByRole('alertdialog'));
    await expect(
      dialog.getByText(
        'Existing installs keep working but stop getting updates.'
      )
    ).toBeVisible();
    await user.click(dialog.getByRole('button', { name: 'Unpublish' }));

    await canvas.findByRole('heading', { name: 'Publish to Gallery' });
    await expect(canvas.getByText('Not published yet')).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveValue('Tokyo Night');
  },
};

export const ShowsPublishedStateUnderTheEditor: StoryObj = {
  ...editor(WITH_RULE),
  parameters: { chrome: { gallery: publishedTokyoNight } },
  name: 'A published style shows Published under the editor, and Unpublished changes after an edit',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('published, linking to its Gallery page', async () => {
      const link = await canvas.findByRole('link', { name: 'Published' });

      await expect(link).toHaveAttribute(
        'href',
        'https://gallery.stylebot.dev/s/example.com/tokyo-night'
      );
    });

    await step('an edit the Gallery lacks', async () => {
      store.commit('setCss', `${RULE_CSS}\n\np { color: red; }`);

      await canvas.findByText('Unpublished changes');
      await user.click(canvas.getByRole('button', { name: 'Publish' }));
      await waitFor(() => expect(store.state.publishing).toBe(true));
    });
  },
};

export const MenuShowsThePublishedState: StoryObj = {
  ...editor(WITH_RULE),
  parameters: { chrome: { gallery: publishedTokyoNight } },
  name: 'The ⋯ menu shows the published version, or that there are changes',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('published, unchanged', async () => {
      const menu = within(await openEditorMenu(canvas, 'Options'));

      await waitFor(() =>
        expect(
          menu.getByRole('menuitem', { name: /Manage publishing/ })
        ).toHaveTextContent('v2')
      );
      await user.keyboard('{Escape}');
    });

    await step('with an edit', async () => {
      store.commit('setCss', `${RULE_CSS}\n\np { color: red; }`);
      const menu = within(await openEditorMenu(canvas, 'Options'));

      await expect(
        menu.getByRole('menuitem', { name: /Publish update/ })
      ).toHaveTextContent('Changes');
    });
  },
};
