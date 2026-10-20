import type {
  CaptureGalleryScreenshot,
  CheckGalleryUsername,
  CheckGalleryUsernameResponse,
  CompressGalleryScreenshot,
  GalleryAccountResponse,
  GalleryScreenshotResponse,
  GetGalleryAccount,
  GetMyGalleryStyles,
  GetMyGalleryStylesResponse,
  GetGalleryScreenshot,
  GetPublishedGalleryStyle,
  GetPublishedGalleryStyleResponse,
  PublishToGallery,
  PublishToGalleryResponse,
  SetGalleryUsername,
  SignInToGallery,
  UnpublishFromGallery,
  UnpublishFromGalleryResponse,
} from '@stylebot/types';

import { flashPage, playShutterSound } from './shutter';

export const getGalleryAccount = (): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<GetGalleryAccount, GalleryAccountResponse>({
    name: 'GetGalleryAccount',
  });

export const signInToGallery = (): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<SignInToGallery, GalleryAccountResponse>({
    name: 'SignInToGallery',
  });

export const setGalleryUsername = (
  username: string
): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<SetGalleryUsername, GalleryAccountResponse>({
    name: 'SetGalleryUsername',
    username,
  });

export const checkGalleryUsername = (
  username: string
): Promise<CheckGalleryUsernameResponse> =>
  chrome.runtime.sendMessage<
    CheckGalleryUsername,
    CheckGalleryUsernameResponse
  >({
    name: 'CheckGalleryUsername',
    username,
  });

export const getMyGalleryStyles = (
  message: Omit<GetMyGalleryStyles, 'name'>
): Promise<GetMyGalleryStylesResponse> =>
  chrome.runtime.sendMessage<GetMyGalleryStyles, GetMyGalleryStylesResponse>({
    name: 'GetMyGalleryStyles',
    ...message,
  });

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

export const compressGalleryScreenshot = (
  screenshot: string
): Promise<GalleryScreenshotResponse> =>
  chrome.runtime.sendMessage<
    CompressGalleryScreenshot,
    GalleryScreenshotResponse
  >({ name: 'CompressGalleryScreenshot', screenshot });

export const getGalleryScreenshot = (
  path: string
): Promise<GalleryScreenshotResponse> =>
  chrome.runtime.sendMessage<GetGalleryScreenshot, GalleryScreenshotResponse>({
    name: 'GetGalleryScreenshot',
    path,
  });

export const publishToGallery = (
  message: Omit<PublishToGallery, 'name'>
): Promise<PublishToGalleryResponse> =>
  chrome.runtime.sendMessage<PublishToGallery, PublishToGalleryResponse>({
    name: 'PublishToGallery',
    ...message,
  });

export const unpublishFromGallery = (
  id: string
): Promise<UnpublishFromGalleryResponse> =>
  chrome.runtime.sendMessage<
    UnpublishFromGallery,
    UnpublishFromGalleryResponse
  >({ name: 'UnpublishFromGallery', id });
