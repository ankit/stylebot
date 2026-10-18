import {
  blobToDataUrl,
  dataUrlToBlob,
  compressScreenshot,
  forgetPublishedStyle,
  getGalleryUrl,
  getInstalledStyleIds,
  getInstalledStyleForProfile,
  getInstalledProfileNames,
  getMyStyles,
  getPublishedStyleIds,
  getSiteStyles,
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
  GetGallerySuggestions as GetGallerySuggestionsType,
  GetGallerySuggestionsResponse,
  PreviewGalleryStyle as PreviewGalleryStyleType,
  PreviewGalleryStyleResponse,
  OpenGalleryPreview as OpenGalleryPreviewType,
  GetGalleryPreview as GetGalleryPreviewType,
  GetGalleryPreviewResponse,
  InstallGalleryPreview as InstallGalleryPreviewType,
  InstallGalleryPreviewResponse,
  EndGalleryPreview as EndGalleryPreviewType,
  GetGalleryInstallStatus as GetGalleryInstallStatusType,
  GetGalleryInstallStatusResponse,
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
import { getAll } from './styles';
import {
  endGalleryPreview,
  getGalleryPreview,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
} from './gallery-preview';
import { isStylebotSite } from './is-stylebot-site';

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
 * What the signed-in account published from a profile, or the gallery style
 * it was installed from, without asking the gallery.
 */
export const GetPublishedGalleryStyle = async (
  { url, profileId }: GetPublishedGalleryStyleType,
  sendResponse: (response: GetPublishedGalleryStyleResponse) => void
): Promise<void> => {
  const account = await getSignedInAccount();
  const published = account
    ? await getPublishedStyleForProfile(url, profileId, account.id)
    : null;
  const installed = await getInstalledStyleForProfile(url, profileId);

  sendResponse({
    published: published && {
      styleId: published.styleId,
      version: published.version,
      cssHash: published.cssHash,
      group: published.group,
      slug: published.slug,
    },
    installed: installed && { group: installed.group, slug: installed.slug },
  });
};

// Enough of a site's styles to still have a couple to suggest after leaving
// out the ones installed or published here.
const SUGGESTIONS_FETCHED = 12;

/**
 * The page's site's most installed gallery styles, leaving out the ones
 * installed or published here.
 */
export const GetGallerySuggestions = async (
  { pageUrl }: GetGallerySuggestionsType,
  sendResponse: (response: GetGallerySuggestionsResponse) => void
): Promise<void> => {
  try {
    const site = toGallerySite(new URL(pageUrl).hostname);
    const [{ styles }, installed, published] = await Promise.all([
      getSiteStyles(site, SUGGESTIONS_FETCHED),
      getAll().then(getInstalledStyleIds),
      getPublishedStyleIds(),
    ]);

    sendResponse({
      ok: true,
      styles: styles.filter(
        style => !installed.has(style.id) && !published.has(style.id)
      ),
      group: styles[0]?.group ?? null,
    });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * The tab a preview message is about: the one it names, as the popup does,
 * or else the page's own.
 */
const getPreviewTabId = (
  sender: chrome.runtime.MessageSender,
  tabId: number | undefined
): number => {
  const id = tabId ?? sender.tab?.id;

  if (id === undefined) {
    throw new Error('No tab for the preview');
  }

  return id;
};

/**
 * Previews a gallery style on the popup's tab, or the page's own.
 */
export const PreviewGalleryStyle = async (
  { id, tabId }: PreviewGalleryStyleType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: PreviewGalleryStyleResponse) => void
): Promise<void> => {
  try {
    await startGalleryPreview(getPreviewTabId(sender, tabId), id);
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * Opens a gallery style's site to preview it, for the gallery's site bridge.
 */
export const OpenGalleryPreview = async (
  { id }: OpenGalleryPreviewType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: PreviewGalleryStyleResponse) => void
): Promise<void> => {
  const fromSiteBridge =
    sender.id === chrome.runtime.id && isStylebotSite(sender.url);
  const isValidId = typeof id === 'string' && id.length <= 64;

  try {
    if (!fromSiteBridge || !isValidId || !sender.tab) {
      throw new Error('Preview refused');
    }

    await openGalleryPreview(id, sender.tab);
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

export const GetGalleryPreview = async (
  { tabId }: GetGalleryPreviewType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetGalleryPreviewResponse) => void
): Promise<void> => {
  const target = tabId ?? sender.tab?.id;

  sendResponse({
    preview: target === undefined ? null : await getGalleryPreview(target),
  });
};

/**
 * Installs a tab's gallery preview as a new profile, counting the install
 * and remembering it.
 */
export const InstallGalleryPreview = async (
  { tabId }: InstallGalleryPreviewType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: InstallGalleryPreviewResponse) => void
): Promise<void> => {
  try {
    const profileName = await installGalleryPreview(
      getPreviewTabId(sender, tabId)
    );

    sendResponse({ ok: true, profileName });
  } catch (e) {
    sendResponse(fail(e));
  }
};

export const EndGalleryPreview = async (
  { tabId }: EndGalleryPreviewType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  const target = tabId ?? sender.tab?.id;

  if (target !== undefined) {
    await endGalleryPreview(target);
  }
};

/**
 * Which of the requested gallery styles are installed, and as which profile,
 * for the site bridge on Stylebot's own sites.
 */
export const GetGalleryInstallStatus = async (
  { styleIds }: GetGalleryInstallStatusType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetGalleryInstallStatusResponse) => void
): Promise<void> => {
  const fromSiteBridge =
    sender.id === chrome.runtime.id && isStylebotSite(sender.url);

  if (!fromSiteBridge || !Array.isArray(styleIds)) {
    sendResponse({ installed: {} });
    return;
  }

  const maxStyles = 100;
  const maxIdLength = 64;
  const ids = styleIds
    .filter(
      (id): id is string => typeof id === 'string' && id.length <= maxIdLength
    )
    .slice(0, maxStyles);

  sendResponse({
    installed: await getInstalledProfileNames(await getAll(), ids),
  });
};
