import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';
import { getGalleryEditUrl, hashCss } from '@stylebot/gallery';

import TheStylebotApp from '../TheStylebotApp.vue';
import {
  editor,
  RULE_CSS,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
import { openEditorMenu, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Gallery',
  tags: ['test'],
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

const published = (css: string) => ({
  chrome: {
    gallery: {
      published: { styleId: 7, version: 1, cssHash: hashCss(css), slug: 'h1' },
    },
  },
});

/**
 * The OpenGalleryDraft messages sent, once one has been.
 */
const sentDrafts = async (send: { mock: { calls: Array<Array<unknown>> } }) => {
  const drafts = () =>
    send.mock.calls
      .map(([message]) => message as { name: string })
      .filter(message => message.name === 'OpenGalleryDraft');

  await waitFor(() => expect(drafts()).toHaveLength(1));

  return drafts();
};

export const PublishFromMenu: StoryObj = {
  ...editor(WITH_RULE),
  name: "Publish to Gallery captures the page and hands the profile's CSS and screenshot to the gallery site",
  play: async ({ canvasElement }) => {
    const send = spyOn(chrome.runtime, 'sendMessage');
    const menu = within(await openEditorMenu(within(canvasElement), 'Options'));

    await user.click(
      menu.getByRole('menuitem', { name: 'Publish to Gallery' })
    );

    await expect(await sentDrafts(send)).toEqual([
      {
        name: 'OpenGalleryDraft',
        url: 'example.com',
        profileId: 'default',
        css: RULE_CSS,
        profileName: expect.any(String),
        screenshot: expect.stringMatching(/^data:image\//),
      },
    ]);
  },
};

export const PublishWithoutScreenshot: StoryObj = {
  ...editor(WITH_RULE),
  parameters: {
    chrome: {
      gallery: { capture: { ok: false, errorKey: 'gallery_error_unknown' } },
    },
  },
  name: 'a capture that fails still opens the gallery site, without a screenshot, so it asks for one',
  play: async ({ canvasElement }) => {
    const send = spyOn(chrome.runtime, 'sendMessage');
    const menu = within(await openEditorMenu(within(canvasElement), 'Options'));

    await user.click(
      menu.getByRole('menuitem', { name: 'Publish to Gallery' })
    );

    const [draft] = await sentDrafts(send);
    await expect(draft).toMatchObject({ screenshot: null });
  },
};

export const PublishUpdate: StoryObj = {
  ...editor(WITH_RULE),
  parameters: published('h1 { color: red; }'),
  name: 'a published profile with edits shows Unpublished changes, and Publish update hands them to the gallery site',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = spyOn(chrome.runtime, 'sendMessage');

    await expect(await canvas.findByText('Unpublished changes')).toBeVisible();
    await user.click(canvas.getByRole('button', { name: 'Publish update' }));

    const [draft] = await sentDrafts(send);
    await expect(draft).toMatchObject({ css: RULE_CSS });
  },
};

export const EditPublished: StoryObj = {
  ...editor(WITH_RULE),
  parameters: published(RULE_CSS),
  name: 'a published profile without edits links to it, and Edit in Gallery opens its edit form on the gallery site',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = spyOn(window, 'open').mockReturnValue(null);

    await expect(
      await canvas.findByRole('link', { name: 'Published' })
    ).toHaveAttribute('href', expect.stringMatching(/\/style\/7\/h1$/));

    const menu = within(await openEditorMenu(canvas, 'Options'));
    await user.click(menu.getByRole('menuitem', { name: 'Edit in Gallery' }));

    await expect(open).toHaveBeenCalledWith(
      getGalleryEditUrl(7),
      '_blank',
      'noopener'
    );
  },
};
