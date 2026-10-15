import type {
  CaptureGalleryScreenshot,
  CompressGalleryScreenshot,
  GalleryAccountResponse,
  GalleryScreenshotResponse,
  GetGalleryAccount,
  GetMyGalleryStyles,
  GetMyGalleryStylesResponse,
  GetPublishedGalleryStyle,
  GetPublishedGalleryStyleResponse,
  PublishToGallery,
  PublishToGalleryResponse,
  SetGalleryDisplayName,
  SignInToGallery,
  UnpublishFromGallery,
  UnpublishFromGalleryResponse,
} from '@stylebot/types';

export const getGalleryAccount = (): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<GetGalleryAccount, GalleryAccountResponse>({
    name: 'GetGalleryAccount',
  });

export const signInToGallery = (): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<SignInToGallery, GalleryAccountResponse>({
    name: 'SignInToGallery',
  });

export const setGalleryDisplayName = (
  displayName: string
): Promise<GalleryAccountResponse> =>
  chrome.runtime.sendMessage<SetGalleryDisplayName, GalleryAccountResponse>({
    name: 'SetGalleryDisplayName',
    displayName,
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

export const captureGalleryScreenshot = (
  tabId?: number
): Promise<GalleryScreenshotResponse> =>
  chrome.runtime.sendMessage<
    CaptureGalleryScreenshot,
    GalleryScreenshotResponse
  >({ name: 'CaptureGalleryScreenshot', tabId });

export const compressGalleryScreenshot = (
  screenshot: string
): Promise<GalleryScreenshotResponse> =>
  chrome.runtime.sendMessage<
    CompressGalleryScreenshot,
    GalleryScreenshotResponse
  >({ name: 'CompressGalleryScreenshot', screenshot });

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
