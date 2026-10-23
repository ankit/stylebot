import type {
  CaptureGalleryScreenshot,
  GalleryScreenshotResponse,
  GetPublishedGalleryStyle,
  GetPublishedGalleryStyleResponse,
  OpenGalleryDraft,
  OpenGalleryDraftResponse,
} from '@stylebot/types';

import { flashPage, playShutterSound } from './shutter';

export const getPublishedGalleryStyle = (
  url: string,
  profileId: string
): Promise<GetPublishedGalleryStyleResponse> =>
  chrome.runtime.sendMessage<
    GetPublishedGalleryStyle,
    GetPublishedGalleryStyleResponse
  >({ name: 'GetPublishedGalleryStyle', url, profileId });

/**
 * Captures a tab for the gallery with a shutter sound. Without tabId it's the
 * tab the editor is in, which also flashes like a camera.
 */
export const captureGalleryScreenshot = async (
  tabId?: number
): Promise<GalleryScreenshotResponse> => {
  const response = await chrome.runtime.sendMessage<
    CaptureGalleryScreenshot,
    GalleryScreenshotResponse
  >({ name: 'CaptureGalleryScreenshot', tabId });

  if (response.ok) {
    playShutterSound();

    if (tabId === undefined) {
      flashPage();
    }
  }

  return response;
};

export const openGalleryDraft = (
  message: Omit<OpenGalleryDraft, 'name'>
): Promise<OpenGalleryDraftResponse> =>
  chrome.runtime.sendMessage<OpenGalleryDraft, OpenGalleryDraftResponse>({
    name: 'OpenGalleryDraft',
    ...message,
  });
