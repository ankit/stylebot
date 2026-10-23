import {
  blobToDataUrl,
  dataUrlToBlob,
  compressScreenshot,
  CSS_UNCHANGED,
  editStyle,
  getGalleryUrl,
  getListedProfileNames,
  getListedStyleIds,
  getMyStyles,
  getSiteStyles,
  getStyle,
  getProfileGalleryListing,
  getSignedInAccount,
  hashCss,
  isGalleryApiError,
  isGalleryStyleId,
  isPublicSite,
  getSuggestionSites,
  publishStyle,
  publishVersion,
  SCREENSHOT_MAX_BYTES,
  setUsername,
  checkUsername,
  signIn,
  signOut,
  storeAccount,
  toGalleryFailure,
  toGallerySite,
  unpublishStyle,
  withSession,
  type StyleForm,
} from '@stylebot/gallery';
import type {
  GalleryAccountResponse,
  GalleryPublishedStyle,
  CaptureGalleryScreenshot as CaptureGalleryScreenshotType,
  CompressGalleryScreenshot as CompressGalleryScreenshotType,
  GetMyGalleryStyles as GetMyGalleryStylesType,
  GetMyGalleryStylesResponse,
  GetGalleryScreenshot as GetGalleryScreenshotType,
  GetGallerySuggestions as GetGallerySuggestionsType,
  GetGallerySuggestionsResponse,
  GetGalleryStyle as GetGalleryStyleType,
  GetGalleryStyleResponse,
  PreviewGalleryStyle as PreviewGalleryStyleType,
  PreviewGalleryStyleResponse,
  OpenGalleryPreview as OpenGalleryPreviewType,
  GetGalleryPreview as GetGalleryPreviewType,
  GetGalleryPreviewResponse,
  InstallGalleryPreview as InstallGalleryPreviewType,
  InstallGalleryPreviewResponse,
  EndGalleryPreview as EndGalleryPreviewType,
  UndoGalleryInstallResponse,
  GetGalleryInstallStatus as GetGalleryInstallStatusType,
  GetGalleryInstallStatusResponse,
  GetPublishedGalleryStyle as GetPublishedGalleryStyleType,
  GetPublishedGalleryStyleResponse,
  PublishToGallery as PublishToGalleryType,
  PublishToGalleryResponse,
  GalleryScreenshotResponse,
  SetGalleryUsername as SetGalleryUsernameType,
  CheckGalleryUsername as CheckGalleryUsernameType,
  CheckGalleryUsernameResponse,
  UnpublishFromGallery as UnpublishFromGalleryType,
  UnpublishFromGalleryResponse,
} from '@stylebot/types';

import { captureTab } from './capture-tab';
import {
  getAll,
  setGalleryListing,
  removeStyleGalleryListings,
} from './styles';
import {
  endGalleryPreview,
  getGalleryPreview,
  getInstallTargetUrl,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
  undoGalleryInstall,
} from './gallery-preview';
import { isStylebotSite } from './is-stylebot-site';
import { get as getOption } from './options';

/**
 * Logs what went wrong, since the editor only shows a message for people.
 */
const fail = (e: unknown) => {
  console.error('Stylebot gallery request failed:', e);
  return toGalleryFailure(e);
};

/**
 * Removes a style's listings when the gallery can't find it, since
 * the website can unpublish or delete it.
 */
const removeListingIfNotFound = async (
  e: unknown,
  styleId: number
): Promise<void> => {
  if (isGalleryApiError(e) && e.status === 404) {
    await removeStyleGalleryListings(styleId);
  }
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
    sendResponse({ ok: true, account: (await signIn()).account });
  } catch (e) {
    sendResponse(fail(e));
  }
};

export const SignOutOfGallery = async (
  sendResponse: (response: GalleryAccountResponse) => void
): Promise<void> => {
  try {
    await signOut();
    sendResponse({ ok: true, account: null });
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
    const all = await withSession(getMyStyles);
    const styles = all.filter(style => style.site === toGallerySite(site));
    const account = await getSignedInAccount();
    const savedStyles = await getAll();
    const listing = getProfileGalleryListing(savedStyles, url, profileId);
    const publishedId =
      account && listing?.authorId === account.id ? listing.styleId : null;

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
 * Fetches a screenshot the gallery shows, to review or publish it again.
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
 * Whether the gallery refused a new version because its CSS is the latest's.
 */
const isCssUnchanged = (e: unknown): boolean =>
  isGalleryApiError(e) && e.code === CSS_UNCHANGED;

/**
 * Publishes a new version of a gallery style when the profile's CSS has
 * changed since it was last published, else edits only its details.
 */
const publishUpdate = async (
  session: string,
  styleId: number,
  form: StyleForm,
  cssChanged: boolean
): Promise<GalleryPublishedStyle> => {
  const details = {
    name: form.name,
    description: form.description,
    screenshot: form.screenshot,
  };

  if (!cssChanged) {
    return editStyle(session, styleId, details);
  }

  try {
    return await publishVersion(session, styleId, form);
  } catch (e) {
    // The CSS can differ only in what the gallery's sanitizer takes out.
    if (isCssUnchanged(e)) {
      return editStyle(session, styleId, details);
    }

    throw e;
  }
};

/**
 * Publishes a style, or updates one with styleId, and remembers it for the
 * profile it came from. An update is a new version only if the CSS changed.
 */
export const PublishToGallery = async (
  message: PublishToGalleryType,
  sendResponse: (response: PublishToGalleryResponse) => void
): Promise<void> => {
  try {
    const { styleId } = message;
    const cssHash = hashCss(message.css);
    const savedStyles = await getAll();
    const listing = getProfileGalleryListing(
      savedStyles,
      message.url,
      message.profileId
    );

    const cssChanged =
      listing?.styleId !== styleId || listing?.cssHash !== cssHash;
    const form: StyleForm = {
      name: message.title,
      description: message.description,
      notes: styleId ? message.notes : undefined,
      css: message.css,
      screenshot: message.screenshot
        ? await compressUnderLimit(message.screenshot)
        : undefined,
    };

    const style = await withSession(session =>
      styleId
        ? publishUpdate(session, styleId, form, cssChanged)
        : publishStyle(session, message.site, form)
    );

    await setGalleryListing(message.url, message.profileId, {
      styleId: style.id,
      slug: style.slug,
      version: style.version,
      cssHash,
      authorId: style.author.id,
    });

    sendResponse({ ok: true, style });
  } catch (e) {
    if (message.styleId) {
      await removeListingIfNotFound(e, message.styleId);
    }

    sendResponse(fail(e));
  }
};

export const UnpublishFromGallery = async (
  { id }: UnpublishFromGalleryType,
  sendResponse: (response: UnpublishFromGalleryResponse) => void
): Promise<void> => {
  try {
    await withSession(session => unpublishStyle(session, id));
    await removeStyleGalleryListings(id);
    sendResponse({ ok: true });
  } catch (e) {
    await removeListingIfNotFound(e, id);
    sendResponse(fail(e));
  }
};

/**
 * Sets the username shown on all the account's styles, or confirms the one
 * it has.
 */
export const SetGalleryUsername = async (
  { username }: SetGalleryUsernameType,
  sendResponse: (response: GalleryAccountResponse) => void
): Promise<void> => {
  try {
    const account = await withSession(session =>
      setUsername(session, username)
    );

    await storeAccount(account);
    sendResponse({ ok: true, account });
  } catch (e) {
    sendResponse(usernameFailure(e));
  }
};

/**
 * A username the gallery turned down, with its reason: it answers a 409
 * for one that's taken or reserved, unlike a version published meanwhile.
 */
const usernameFailure = (e: unknown) => {
  if (!isGalleryApiError(e) || e.status !== 409) {
    return fail(e);
  }

  return {
    ok: false as const,
    errorKey: /reserved/i.test(e.message)
      ? ('that_username_is_reserved' as const)
      : ('that_username_is_taken' as const),
    errorDetail: e.message,
  };
};

/**
 * Whether the account can take a username, as it's typed.
 */
export const CheckGalleryUsername = async (
  { username }: CheckGalleryUsernameType,
  sendResponse: (response: CheckGalleryUsernameResponse) => void
): Promise<void> => {
  try {
    const check = await withSession(session =>
      checkUsername(session, username)
    );

    sendResponse({ ok: true, ...check });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * The signed-in account's own gallery style a profile is listed as, or else
 * the gallery style it was installed from, without asking the gallery.
 */
export const GetPublishedGalleryStyle = async (
  { url, profileId }: GetPublishedGalleryStyleType,
  sendResponse: (response: GetPublishedGalleryStyleResponse) => void
): Promise<void> => {
  const account = await getSignedInAccount();
  const savedStyles = await getAll();
  const listing = getProfileGalleryListing(savedStyles, url, profileId);

  if (!listing) {
    sendResponse({ published: null, installed: null });
    return;
  }

  const { authorId, ...published } = listing;

  if (authorId !== account?.id) {
    const { styleId, slug } = listing;
    sendResponse({ published: null, installed: { id: styleId, slug } });
    return;
  }

  sendResponse({ published, installed: null });
};

// Enough of a site's styles to still have a couple to suggest after leaving
// out the ones installed or published here.
const SUGGESTIONS_FETCHED = 12;

/**
 * Whether the gallery may be asked about a page's site: suggestions are on,
 * the tab isn't private, the site is public and the gallery lists it, so the
 * site's name never leaves the browser otherwise.
 */
const canAskGalleryAbout = async (
  url: URL,
  site: string,
  incognito: boolean
): Promise<boolean> => {
  const enabled = await getOption('gallerySuggestions');

  if (!enabled || incognito || !isPublicSite(url)) {
    return false;
  }

  const sites = await getSuggestionSites();
  return sites.has(site);
};

/**
 * The page's site's most installed gallery styles, leaving out the ones
 * installed or published here.
 */
export const GetGallerySuggestions = async (
  { pageUrl, incognito }: GetGallerySuggestionsType,
  sendResponse: (response: GetGallerySuggestionsResponse) => void
): Promise<void> => {
  try {
    const url = new URL(pageUrl);
    const site = toGallerySite(url.hostname);
    const allowed = await canAskGalleryAbout(url, site, incognito);

    if (!allowed) {
      sendResponse({ ok: true, styles: [], site });
      return;
    }

    const [{ styles }, listed] = await Promise.all([
      getSiteStyles(site, SUGGESTIONS_FETCHED),
      getAll().then(getListedStyleIds),
    ]);

    sendResponse({
      ok: true,
      styles: styles.filter(style => !listed.has(style.id)),
      site,
    });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * A gallery style without its CSS, for who wrote it and its latest version.
 */
export const GetGalleryStyle = async (
  { styleId }: GetGalleryStyleType,
  sendResponse: (response: GetGalleryStyleResponse) => void
): Promise<void> => {
  try {
    const { css: _css, ...style } = await getStyle(styleId);

    sendResponse({ ok: true, style });
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

  try {
    if (!fromSiteBridge || !isGalleryStyleId(id) || !sender.tab) {
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
  const preview = target === undefined ? null : await getGalleryPreview(target);
  const pageUrl = tabId === undefined ? sender.tab?.url : undefined;

  if (!preview || !pageUrl) {
    sendResponse({ preview });
    return;
  }

  const replacedUrl = await getInstallTargetUrl(preview.style, pageUrl);
  sendResponse({ preview, replacedUrl });
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
 * Undoes the install the sending tab's preview bar just confirmed.
 */
export const UndoGalleryInstall = async (
  _message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: UndoGalleryInstallResponse) => void
): Promise<void> => {
  try {
    await undoGalleryInstall(getPreviewTabId(sender, undefined));
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
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
  const ids = styleIds.filter(isGalleryStyleId).slice(0, maxStyles);
  const savedStyles = await getAll();

  sendResponse({ installed: getListedProfileNames(savedStyles, ids) });
};
