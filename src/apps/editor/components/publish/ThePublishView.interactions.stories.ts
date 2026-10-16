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
import {
  GALLERY_PUBLISHED_SCREENSHOT,
  type GalleryShimOptions,
} from '@stylebot/storybook/mocks/chrome';
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

/**
 * Closes the review open over the page with Done or Cancel.
 */
const closeReview = async (
  canvas: ReturnType<typeof within>,
  button: 'Done' | 'Cancel'
) => {
  const review = within(
    await canvas.findByRole('dialog', { name: 'Review screenshot' })
  );

  await user.click(review.getByRole('button', { name: button }));
  await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
};

/**
 * Takes a screenshot and keeps it as it is from the review that opens.
 */
const takeScreenshot = async (canvas: ReturnType<typeof within>) => {
  await user.click(
    await canvas.findByRole('button', { name: 'Take screenshot' })
  );
  await closeReview(canvas, 'Done');
};

const screenshotSrc = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('img', { name: 'Screenshot' }).getAttribute('src');

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

export const TitleGoesBack: StoryObj = {
  ...publishView({ account }),
  name: 'Clicking the title goes back to the editor, like the back arrow',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(
      await canvas.findByRole('heading', { name: 'Publish to Gallery' })
    );

    await waitFor(() =>
      expect(storeOf(canvasElement).state.publishing).toBe(false)
    );
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
  name: 'Signing in unlocks the form behind it, and publishing lists what the Gallery took out',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('signed out, the form waits behind sign-in', async () => {
      const signIn = await canvas.findByRole('button', {
        name: 'Sign in with Google to publish',
      });

      await expect(
        canvasElement.querySelector('.publish-view .form')
      ).toHaveAttribute('inert');

      await user.click(signIn);
    });

    await step('signed in, the form unlocks in place', async () => {
      await waitFor(() =>
        expect(
          canvasElement.querySelector('.publish-view .form')
        ).not.toHaveAttribute('inert')
      );
      await expect(
        canvas.queryByRole('button', { name: 'Sign in with Google to publish' })
      ).toBeNull();
    });

    await step('publish waits for a screenshot and a name', async () => {
      await expect(publishButton(canvas)).toBeDisabled();

      await takeScreenshot(canvas);
      await user.type(canvas.getByLabelText('Name'), 'Night reading');
      await expect(publishButton(canvas)).toBeEnabled();
    });

    await step('publish', async () => {
      await user.click(publishButton(canvas));

      await canvas.findByText('Version 1 is live in the Gallery');
      await expect(
        canvas.getByRole('heading', { name: 'Night reading' })
      ).toBeVisible();
      await expect(
        canvas.getByText('@import url(https://example.com/theme.css);')
      ).toBeVisible();
    });

    await step('the back arrow goes back to the editor', async () => {
      await expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible();
      await expect(
        canvas.getByRole('button', { name: 'View in Gallery ↗' })
      ).toBeVisible();

      await user.click(canvas.getByRole('button', { name: 'Back' }));
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
      await expect(publishButton(canvas, 'Publish version 3')).toBeDisabled();
    });

    await step("the Gallery's screenshot is kept", async () => {
      await waitFor(() =>
        expect(canvas.getByRole('img', { name: 'Screenshot' })).toHaveAttribute(
          'src',
          GALLERY_PUBLISHED_SCREENSHOT
        )
      );
    });

    await step('a new screenshot is enough to publish', async () => {
      await user.click(
        canvas.getByRole('button', {
          name: 'Retake',
        })
      );
      await closeReview(canvas, 'Done');
      await waitFor(() =>
        expect(
          canvas.getByRole('img', { name: 'Screenshot' })
        ).not.toHaveAttribute('src', GALLERY_PUBLISHED_SCREENSHOT)
      );
      await waitFor(() =>
        expect(publishButton(canvas, 'Publish version 3')).toBeEnabled()
      );
      await user.click(publishButton(canvas, 'Publish version 3'));

      await canvas.findByText('Version 2 is live in the Gallery');
    });
  },
};

export const WaitsForTheCompressedScreenshot: StoryObj = {
  ...publishView({ account, compress: 'pending' }),
  name: 'A capture shows as taken, and publishing waits until it fits the Gallery',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await takeScreenshot(canvas);
    await user.type(canvas.getByLabelText('Name'), 'Night reading');

    await expect(publishButton(canvas)).toBeDisabled();
  },
};

export const BlursInTheReview: StoryObj = {
  ...publishView({ account }),
  name: 'A new screenshot opens for review, and what is blurred there is kept',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    let review: ReturnType<typeof within>;

    await step('taking a screenshot opens the review', async () => {
      await user.click(
        await canvas.findByRole('button', { name: 'Take screenshot' })
      );
      review = within(
        await canvas.findByRole('dialog', { name: 'Review screenshot' })
      );
    });

    await step('drag over part of it to blur it', async () => {
      const image = review.getByRole('img', {
        name: 'Screenshot',
      }) as HTMLImageElement;
      await image.decode();
      const { left, top, width, height } = image.getBoundingClientRect();

      await user.pointer([
        {
          keys: '[MouseLeft>]',
          target: image,
          coords: { clientX: left + width * 0.1, clientY: top + height * 0.1 },
        },
        {
          target: image,
          coords: { clientX: left + width * 0.6, clientY: top + height * 0.4 },
        },
        { keys: '[/MouseLeft]', target: image },
      ]);

      await review.findByRole('button', { name: 'Remove blur' });
    });

    await step('Done keeps the blurred screenshot', async () => {
      const before = review
        .getByRole('img', { name: 'Screenshot' })
        .getAttribute('src');

      await user.click(review.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(screenshotSrc(canvas)).not.toBe(before));
    });
  },
};

export const ReviewsAgainFromTheField: StoryObj = {
  ...publishView({ account }),
  name: 'Review opens the screenshot again, and Cancel keeps it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await takeScreenshot(canvas);
    const before = screenshotSrc(canvas);

    await user.click(canvas.getByRole('button', { name: 'Review screenshot' }));
    await closeReview(canvas, 'Cancel');

    await expect(screenshotSrc(canvas)).toBe(before);
  },
};

export const CancelDiscardsTheCapture: StoryObj = {
  ...publishView({ account }),
  name: 'Cancelling the review of a new screenshot throws it away',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(
      await canvas.findByRole('button', { name: 'Take screenshot' })
    );
    await closeReview(canvas, 'Cancel');

    await expect(
      canvas.getByRole('button', { name: 'Take screenshot' })
    ).toBeVisible();
    await expect(canvas.queryByRole('img', { name: 'Screenshot' })).toBeNull();
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
    await expect(publishButton(canvas)).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveValue('Tokyo Night');
  },
};

export const ShowsPublishedStateUnderTheEditor: StoryObj = {
  ...editor(WITH_RULE),
  parameters: { chrome: { gallery: publishedTokyoNight } },
  name: 'A published style shows its live version under the editor, and Unpublished changes after an edit',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('published, linking to its Gallery page', async () => {
      const link = await canvas.findByRole('link', {
        name: /Version 2/,
      });

      await expect(link).toHaveAttribute(
        'href',
        'https://gallery.stylebot.dev/s/example.com/tokyo-night'
      );
    });

    await step('an edit the Gallery lacks', async () => {
      store.commit('setCss', `${RULE_CSS}\n\np { color: red; }`);

      await canvas.findByText('Unpublished changes');
      await user.click(canvas.getByRole('button', { name: 'Publish update' }));
      await waitFor(() => expect(store.state.publishing).toBe(true));
    });
  },
};

export const MenuShowsThePublishedState: StoryObj = {
  ...editor(WITH_RULE),
  parameters: { chrome: { gallery: publishedTokyoNight } },
  name: 'The ⋯ menu offers to manage a published style, or to publish its changes',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('published, unchanged', async () => {
      const menu = within(await openEditorMenu(canvas, 'Options'));

      await expect(
        await menu.findByRole('menuitem', { name: 'Manage publishing' })
      ).toBeVisible();
      await user.keyboard('{Escape}');
    });

    await step('with an edit', async () => {
      store.commit('setCss', `${RULE_CSS}\n\np { color: red; }`);
      const menu = within(await openEditorMenu(canvas, 'Options'));

      await expect(
        menu.getByRole('menuitem', { name: 'Publish update' })
      ).toBeVisible();
    });
  },
};
