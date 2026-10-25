import type {
  GalleryDraftPublished,
  GalleryDraftPublishedResponse,
  GalleryStyleDeleted,
  GalleryStyleDeletedResponse,
  GetGalleryDraft,
  GetGalleryDraftResponse,
  GetGalleryInstallStatus,
  GetGalleryInstallStatusResponse,
  InstallStyle,
  InstallStyleResponse,
  OpenGalleryPreview,
  OpenGalleryDraftResponse,
  PreviewGalleryStyleResponse,
  PublishGalleryStyleUpdate,
} from '@stylebot/types';

import type {
  SiteMessages,
  SiteReply,
  SiteRequest,
  SiteRequestType,
} from './protocol';

type Handler<T extends SiteRequestType> = (
  request: SiteMessages[T]['request']
) => SiteMessages[T]['reply'] | Promise<SiteMessages[T]['reply']>;

const handlers: { [T in SiteRequestType]: Handler<T> } = {
  'stylebot:ping': () => ({ type: 'stylebot:pong' }),

  'stylebot:install': async ({ id, url, name, css }) => {
    const message: InstallStyle = {
      name: 'InstallStyle',
      url,
      profileName: name,
      css,
    };
    const response = await chrome.runtime
      .sendMessage<InstallStyle, InstallStyleResponse>(message)
      .catch((): InstallStyleResponse => ({}));

    return {
      type: 'stylebot:installed',
      id,
      profileName: response?.profileName ?? null,
    };
  },

  'stylebot:preview': async ({ id }) => {
    // It opens a tab, so only right after the user clicked, like a popup.
    if (!navigator.userActivation?.isActive) {
      return { type: 'stylebot:preview:result', id, ok: false };
    }

    const message: OpenGalleryPreview = { name: 'OpenGalleryPreview', id };
    const response = await chrome.runtime
      .sendMessage<OpenGalleryPreview, PreviewGalleryStyleResponse>(message)
      .catch((): null => null);

    return { type: 'stylebot:preview:result', id, ok: Boolean(response?.ok) };
  },

  'stylebot:status': async ({ id, styleIds }) => {
    const message: GetGalleryInstallStatus = {
      name: 'GetGalleryInstallStatus',
      styleIds,
    };
    const response = await chrome.runtime
      .sendMessage<GetGalleryInstallStatus, GetGalleryInstallStatusResponse>(
        message
      )
      .catch((): null => null);

    return {
      type: 'stylebot:status:result',
      id,
      installed: response?.installed ?? {},
      published: response?.published ?? {},
    };
  },

  'stylebot:publish': async ({ id }) => {
    // It leaves the page, so only right after the user clicked.
    if (!navigator.userActivation?.isActive) {
      return { type: 'stylebot:publish:result', id, ok: false };
    }

    const message: PublishGalleryStyleUpdate = {
      name: 'PublishGalleryStyleUpdate',
      styleId: id,
    };
    const response = await chrome.runtime
      .sendMessage<PublishGalleryStyleUpdate, OpenGalleryDraftResponse>(message)
      .catch((): null => null);

    return { type: 'stylebot:publish:result', id, ok: Boolean(response?.ok) };
  },

  'stylebot:draft': async ({ id }) => {
    const message: GetGalleryDraft = { name: 'GetGalleryDraft', id };
    const response = await chrome.runtime
      .sendMessage<GetGalleryDraft, GetGalleryDraftResponse>(message)
      .catch((): null => null);

    return {
      type: 'stylebot:draft:result',
      id,
      draft: response?.draft ?? null,
    };
  },

  'stylebot:published': async ({ id, styleId, version, slug }) => {
    const message: GalleryDraftPublished = {
      name: 'GalleryDraftPublished',
      id,
      styleId,
      version,
      slug,
    };
    const response = await chrome.runtime
      .sendMessage<GalleryDraftPublished, GalleryDraftPublishedResponse>(
        message
      )
      .catch((): null => null);

    return {
      type: 'stylebot:published:result',
      id,
      ok: Boolean(response?.ok),
    };
  },

  'stylebot:deleted': async ({ id }) => {
    const message: GalleryStyleDeleted = {
      name: 'GalleryStyleDeleted',
      styleId: id,
    };
    const response = await chrome.runtime
      .sendMessage<GalleryStyleDeleted, GalleryStyleDeletedResponse>(message)
      .catch((): null => null);

    return { type: 'stylebot:deleted:result', id, ok: Boolean(response?.ok) };
  },
};

/**
 * Answers a request from the page, or null for anything that isn't one.
 */
export const handleSiteRequest = async (
  request: SiteRequest | undefined
): Promise<SiteReply | null> => {
  if (!request || !Object.hasOwn(handlers, request.type)) {
    return null;
  }

  const handler = handlers[request.type] as Handler<SiteRequestType>;
  const reply = await handler(request);

  return reply;
};
