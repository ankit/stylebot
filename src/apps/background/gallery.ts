import {
  blobToDataUrl,
  dataUrlToBlob,
  compressScreenshot,
  forgetPublishedStyle,
  getGalleryUrl,
  getMyStyles,
  getPublishedStyleForProfile,
  getPublishedStyleIdForProfile,
  getSignedInAccount,
  hashCss,
  publishStyle,
  publishVersion,
  SCREENSHOT_MAX_BYTES,
  setDisplayName,
  rememberPublishedStyle,
  signIn,
  storeAccount,
  toGalleryFailure,
  toGallerySite,
  unpublishStyle,
  withSession,
  type GoogleTokenSource,
} from '@stylebot/gallery';
import { clearGoogleAccessToken, getGoogleAccessToken } from '@stylebot/sync';
import type {
  GalleryAccountResponse,
  CaptureGalleryScreenshot as CaptureGalleryScreenshotType,
  CompressGalleryScreenshot as CompressGalleryScreenshotType,
  GetMyGalleryStyles as GetMyGalleryStylesType,
  GetMyGalleryStylesResponse,
  GetGalleryScreenshot as GetGalleryScreenshotType,
  GetPublishedGalleryStyle as GetPublishedGalleryStyleType,
  GetPublishedGalleryStyleResponse,
  PublishToGallery as PublishToGalleryType,
  PublishToGalleryResponse,
  GalleryScreenshotResponse,
  SetGalleryDisplayName as SetGalleryDisplayNameType,
  UnpublishFromGallery as UnpublishFromGalleryType,
  UnpublishFromGalleryResponse,
} from '@stylebot/types';

import { captureTab } from './capture-tab';

// Gallery sign-in reuses Drive sync's Google sign-in.
const google: GoogleTokenSource = {
  getToken: () => getGoogleAccessToken({ interactive: true }),
  clearToken: clearGoogleAccessToken,
};

/**
 * Logs what went wrong, since the editor only shows a message for people.
 */
const fail = (e: unknown) => {
  console.error('Stylebot gallery request failed:', e);
  return toGalleryFailure(e);
};

/**
 * The screenshot to upload: as sent, unless it's somehow over the gallery's
 * limit, when it's fitted again rather than turned down.
 */
const compressUnderLimit = async (dataUrl: string): Promise<Blob> => {
  const blob = dataUrlToBlob(dataUrl);
  return blob.size > SCREENSHOT_MAX_BYTES ? compressScreenshot(dataUrl) : blob;
};

/**
 * The signed-in gallery account, without signing in.
 */
export const GetGalleryAccount = async (
  sendResponse: (response: GalleryAccountResponse) => void
): Promise<void> => {
  sendResponse({ ok: true, account: await getSignedInAccount() });
};

export const SignInToGallery = async (
  sendResponse: (response: GalleryAccountResponse) => void
): Promise<void> => {
  try {
    sendResponse({ ok: true, account: (await signIn(google)).account });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * The account's gallery styles for a site, and which of them was published
 * from the given Stylebot style's profile.
 */
export const GetMyGalleryStyles = async (
  { site, url, profileId }: GetMyGalleryStylesType,
  sendResponse: (response: GetMyGalleryStylesResponse) => void
): Promise<void> => {
  try {
    const all = await withSession(google, getMyStyles);
    const styles = all.filter(style => style.site === toGallerySite(site));
    const account = await getSignedInAccount();
    const publishedId =
      account &&
      (await getPublishedStyleIdForProfile(url, profileId, account.id));

    sendResponse({
      ok: true,
      styles,
      publishedId: styles.some(style => style.id === publishedId)
        ? publishedId
        : null,
    });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * Captures a tab as it shows now, at full size; CompressGalleryScreenshot makes
 * the copy that's uploaded.
 */
export const CaptureGalleryScreenshot = async (
  { tabId }: CaptureGalleryScreenshotType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GalleryScreenshotResponse) => void
): Promise<void> => {
  try {
    const tab = tabId === undefined ? sender.tab : await chrome.tabs.get(tabId);

    if (!tab) {
      throw new Error('No tab to capture');
    }

    sendResponse({ ok: true, screenshot: await captureTab(tab) });
  } catch (e) {
    sendResponse({ ...fail(e), errorKey: 'gallery_error_screenshot' });
  }
};

/**
 * Scales and compresses a screenshot to fit the gallery's limit.
 */
export const CompressGalleryScreenshot = async (
  { screenshot }: CompressGalleryScreenshotType,
  sendResponse: (response: GalleryScreenshotResponse) => void
): Promise<void> => {
  try {
    sendResponse({
      ok: true,
      screenshot: await blobToDataUrl(await compressScreenshot(screenshot)),
    });
  } catch (e) {
    const failure = fail(e);

    sendResponse(
      failure.errorKey === 'gallery_error_screenshot_too_large'
        ? failure
        : { ...failure, errorKey: 'gallery_error_screenshot' }
    );
  }
};

/**
 * Fetches a screenshot the gallery shows, so an update can keep it.
 */
export const GetGalleryScreenshot = async (
  { path }: GetGalleryScreenshotType,
  sendResponse: (response: GalleryScreenshotResponse) => void
): Promise<void> => {
  try {
    const response = await fetch(getGalleryUrl(path));

    if (!response.ok) {
      throw new Error(`Screenshot request failed (${response.status})`);
    }

    sendResponse({
      ok: true,
      screenshot: await blobToDataUrl(await response.blob()),
    });
  } catch (e) {
    sendResponse({ ...fail(e), errorKey: 'gallery_error_screenshot' });
  }
};

/**
 * Publishes a style, or a new version of one with styleId, and remembers it
 * for the profile it came from.
 */
export const PublishToGallery = async (
  message: PublishToGalleryType,
  sendResponse: (response: PublishToGalleryResponse) => void
): Promise<void> => {
  try {
    const form = {
      name: message.title,
      description: message.description,
      notes: message.styleId ? message.notes : undefined,
      css: message.css,
      screenshot: await compressUnderLimit(message.screenshot),
    };

    const style = await withSession(google, session =>
      message.styleId
        ? publishVersion(session, message.styleId, form)
        : publishStyle(session, message.site, form)
    );

    await rememberPublishedStyle(message.url, message.profileId, {
      styleId: style.id,
      version: style.version,
      accountId: style.author.id,
      cssHash: hashCss(message.css),
      group: style.group,
      slug: style.slug,
    });

    sendResponse({ ok: true, style });
  } catch (e) {
    sendResponse(fail(e));
  }
};

export const UnpublishFromGallery = async (
  { id }: UnpublishFromGalleryType,
  sendResponse: (response: UnpublishFromGalleryResponse) => void
): Promise<void> => {
  try {
    await withSession(google, session => unpublishStyle(session, id));
    await forgetPublishedStyle(id);
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * Sets the alias shown on all the account's styles.
 */
export const SetGalleryDisplayName = async (
  { displayName }: SetGalleryDisplayNameType,
  sendResponse: (response: GalleryAccountResponse) => void
): Promise<void> => {
  try {
    const account = await withSession(google, session =>
      setDisplayName(session, displayName.trim())
    );

    await storeAccount(account);
    sendResponse({ ok: true, account });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * What the signed-in account published from a profile, without asking the
 * gallery.
 */
export const GetPublishedGalleryStyle = async (
  { url, profileId }: GetPublishedGalleryStyleType,
  sendResponse: (response: GetPublishedGalleryStyleResponse) => void
): Promise<void> => {
  const account = await getSignedInAccount();
  const published = account
    ? await getPublishedStyleForProfile(url, profileId, account.id)
    : null;

  sendResponse({
    published: published && {
      styleId: published.styleId,
      version: published.version,
      cssHash: published.cssHash,
      group: published.group,
      slug: published.slug,
    },
  });
};
