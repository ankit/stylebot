import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';
import { getGalleryEditUrl, hashCss } from '@stylebot/gallery';

import TheStylebotApp from '../TheStylebotApp.vue';
import {
  editor,
  RULE_CSS,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
import { gallerySuggestions } from '@stylebot/storybook/fixtures/popup';
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

const installed = (css: string) => ({
  id: 1,
  slug: 'tokyo-night',
  cssHash: hashCss(css),
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
  name: 'a published profile with edits shows Unpublished changes, and Publish hands them to the gallery site',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = spyOn(chrome.runtime, 'sendMessage');

    await expect(await canvas.findByText('Unpublished changes')).toBeVisible();
    await user.click(canvas.getByRole('button', { name: 'Publish' }));

    const [draft] = await sentDrafts(send);
    await expect(draft).toMatchObject({ css: RULE_CSS });
  },
};

export const ManagePublished: StoryObj = {
  ...editor(WITH_RULE),
  parameters: published(RULE_CSS),
  name: 'a published profile without edits says Published, with Manage opening its edit form on the gallery site, and the menu leaves out Publish to Gallery',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText('Published')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Manage' })).toHaveAttribute(
      'href',
      getGalleryEditUrl(7)
    );

    const menu = within(await openEditorMenu(canvas, 'Options'));
    await expect(menu.queryByRole('menuitem', { name: /Gallery/ })).toBeNull();
  },
};

export const FromGallery: StoryObj = {
  ...editor(WITH_RULE),
  parameters: {
    chrome: {
      gallery: {
        installed: installed(RULE_CSS),
        suggestions: gallerySuggestions,
      },
    },
  },
  name: 'a profile installed from the Gallery names its author, with View opening its Gallery page, and the menu leaves out Publish to Gallery',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText('Gallery style by maya')
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/style\/1\/tokyo-night$/)
    );

    const menu = within(await openEditorMenu(canvas, 'Options'));
    await expect(menu.queryByRole('menuitem', { name: /Gallery/ })).toBeNull();
  },
};

export const ResetEditedInstall: StoryObj = {
  ...editor(WITH_RULE),
  parameters: {
    chrome: {
      gallery: {
        installed: installed('h1 { color: red; }'),
        suggestions: gallerySuggestions,
      },
    },
  },
  name: "a profile edited since it was installed from the Gallery names it as your edit of its author's style, and Revert puts the Gallery version back",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = spyOn(chrome.runtime, 'sendMessage');

    await expect(
      await canvas.findByText("Your edit of maya's style")
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      expect.stringContaining('/style/1/tokyo-night')
    );
    await user.click(
      canvas.getByRole('button', { name: 'Use Gallery version' })
    );

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        name: 'ResetGalleryProfile',
        url: 'example.com',
        profileId: 'default',
      })
    );
  },
};

export const ResetFails: StoryObj = {
  ...editor(WITH_RULE),
  parameters: {
    chrome: {
      gallery: {
        installed: installed('h1 { color: red; }'),
        reset: { ok: false, errorKey: 'gallery_error_not_found' },
      },
    },
  },
  name: 'an edited install whose author is unknown says it is your edit of a Gallery style, and a failed Revert says why',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText('Your edit of a Gallery style')
    ).toBeVisible();

    await user.click(
      await canvas.findByRole('button', { name: 'Use Gallery version' })
    );

    await expect(
      await canvas.findByText("This style isn't in the Gallery anymore.")
    ).toBeVisible();
  },
};
