import type {
  CaptureGalleryScreenshot,
  GalleryScreenshotResponse,
  GetGalleryStyle,
  GetGalleryStyleResponse,
  GetPublishedGalleryStyle,
  GetPublishedGalleryStyleResponse,
  OpenGalleryDraft,
  OpenGalleryDraftResponse,
} from '@stylebot/types';

export const getPublishedGalleryStyle = (
  url: string,
  profileId: string
): Promise<GetPublishedGalleryStyleResponse> =>
  chrome.runtime.sendMessage<
    GetPublishedGalleryStyle,
    GetPublishedGalleryStyleResponse
  >({ name: 'GetPublishedGalleryStyle', url, profileId });

/**
 * Captures a tab for the gallery. Without tabId it's the tab the editor is in.
 */
export const captureGalleryScreenshot = (
  tabId?: number
): Promise<GalleryScreenshotResponse> =>
  chrome.runtime.sendMessage<
    CaptureGalleryScreenshot,
    GalleryScreenshotResponse
  >({ name: 'CaptureGalleryScreenshot', tabId });

export const openGalleryDraft = (
  message: Omit<OpenGalleryDraft, 'name'>
): Promise<OpenGalleryDraftResponse> =>
  chrome.runtime.sendMessage<OpenGalleryDraft, OpenGalleryDraftResponse>({
    name: 'OpenGalleryDraft',
    ...message,
  });

export const getGalleryStyle = (
  styleId: number
): Promise<GetGalleryStyleResponse> =>
  chrome.runtime.sendMessage<GetGalleryStyle, GetGalleryStyleResponse>({
    name: 'GetGalleryStyle',
    styleId,
  });
