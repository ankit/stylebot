import {
  blobToDataUrl,
  compressScreenshot,
  deleteGalleryDraft,
  getGalleryDraft,
  getGalleryPublishUrl,
  getListedProfileNames,
  getListedStyleIds,
  getSiteStyles,
  getStyle,
  getProfileGalleryListing,
  hashCss,
  isGalleryStyleId,
  isPublicSite,
  getSuggestionSites,
  saveGalleryDraft,
  toGalleryFailure,
  toGallerySite,
} from '@stylebot/gallery';
import type {
  CaptureGalleryScreenshot as CaptureGalleryScreenshotType,
  OpenGalleryDraft as OpenGalleryDraftType,
  OpenGalleryDraftResponse,
  GetGalleryDraft as GetGalleryDraftType,
  GetGalleryDraftResponse,
  GalleryDraftPublished as GalleryDraftPublishedType,
  GalleryDraftPublishedResponse,
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
  GalleryScreenshotResponse,
} from '@stylebot/types';

import { captureTab } from './capture-tab';
import { getAll, setGalleryListing } from './styles';
import {
  endGalleryPreview,
  getGalleryPreview,
  getInstallTargetUrl,
  installGalleryPreview,
  openGalleryPreview,
  startGalleryPreview,
  undoGalleryInstall,
} from './gallery-preview';
import { isGallerySite, isStylebotSite } from './is-stylebot-site';
import { get as getOption } from './options';

/**
 * Logs what went wrong, since the editor only shows a message for people.
 */
const fail = (e: unknown) => {
  console.error('Stylebot gallery request failed:', e);
  return toGalleryFailure(e);
};

/**
 * Whether a message came from the site bridge on the gallery.
 */
const isFromGallery = (sender: chrome.runtime.MessageSender): boolean =>
  sender.id === chrome.runtime.id && isGallerySite(sender.url);

/**
 * Captures a tab as it shows now, at full size; OpenGalleryDraft fits it to
 * the gallery's limit.
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
    sendResponse(fail(e));
  }
};

/**
 * A screenshot fitted to the gallery's limit, or null when it can't be, so
 * the gallery site asks for one instead.
 */
const fitScreenshot = async (
  screenshot: string | null
): Promise<string | null> => {
  if (!screenshot) {
    return null;
  }

  try {
    return await blobToDataUrl(await compressScreenshot(screenshot));
  } catch (e) {
    fail(e);
    return null;
  }
};

/**
 * Keeps a profile as a draft and opens the gallery site's publish page on it,
 * beside the tab it came from. A profile published from here before updates
 * its gallery style.
 */
const openDraft = async (
  {
    url,
    profileId,
    css,
    profileName,
    screenshot,
  }: Omit<OpenGalleryDraftType, 'name'>,
  openerTabId: number | undefined
): Promise<void> => {
  const savedStyles = await getAll();
  const listing = getProfileGalleryListing(savedStyles, url, profileId);
  const id = await saveGalleryDraft({
    site: url,
    url,
    profileId,
    css,
    name: profileName,
    screenshot: await fitScreenshot(screenshot),
    styleId: listing?.published ? listing.styleId : null,
  });

  await chrome.tabs.create({
    url: getGalleryPublishUrl(id),
    ...(openerTabId !== undefined ? { openerTabId } : {}),
  });
};

export const OpenGalleryDraft = async (
  { name: _name, ...draft }: OpenGalleryDraftType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: OpenGalleryDraftResponse) => void
): Promise<void> => {
  try {
    await openDraft(draft, sender.tab?.id);
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * A draft for the gallery's publish page, as often as it asks until it's
 * published or expires.
 */
export const GetGalleryDraft = async (
  { id }: GetGalleryDraftType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetGalleryDraftResponse) => void
): Promise<void> => {
  if (!isFromGallery(sender) || typeof id !== 'string') {
    sendResponse({ draft: null });
    return;
  }

  const stored = await getGalleryDraft(id);

  if (!stored) {
    sendResponse({ draft: null });
    return;
  }

  const { site, url, css, name, screenshot, styleId } = stored;
  sendResponse({ draft: { site, url, css, name, screenshot, styleId } });
};

/**
 * Whether the gallery site's report of a publish names a draft and a
 * version of a gallery style.
 */
const isPublishReport = ({
  id,
  styleId,
  version,
  slug,
}: GalleryDraftPublishedType): boolean =>
  typeof id === 'string' &&
  isGalleryStyleId(styleId) &&
  isGalleryStyleId(version) &&
  typeof slug === 'string';

/**
 * Remembers what the gallery site published from a draft on the profile it
 * came from. The hash is of the draft's CSS, so edits made meanwhile still
 * show as unpublished.
 */
export const GalleryDraftPublished = async (
  message: GalleryDraftPublishedType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GalleryDraftPublishedResponse) => void
): Promise<void> => {
  if (!isFromGallery(sender) || !isPublishReport(message)) {
    sendResponse({ ok: false });
    return;
  }

  const { id, styleId, version, slug } = message;
  const draft = await getGalleryDraft(id);

  if (!draft) {
    sendResponse({ ok: false });
    return;
  }

  try {
    await setGalleryListing(draft.url, draft.profileId, {
      styleId,
      slug,
      version,
      cssHash: hashCss(draft.css),
      published: true,
    });
    await deleteGalleryDraft(id);
    sendResponse({ ok: true });
  } catch (e) {
    fail(e);
    sendResponse({ ok: false });
  }
};

/**
 * What was published from a profile, or else the gallery style it was
 * installed from, without asking the gallery.
 */
export const GetPublishedGalleryStyle = async (
  { url, profileId }: GetPublishedGalleryStyleType,
  sendResponse: (response: GetPublishedGalleryStyleResponse) => void
): Promise<void> => {
  const savedStyles = await getAll();
  const listing = getProfileGalleryListing(savedStyles, url, profileId);

  if (!listing) {
    sendResponse({ published: null, installed: null });
    return;
  }

  const { published, ...rest } = listing;

  if (!published) {
    sendResponse({
      published: null,
      installed: { id: rest.styleId, slug: rest.slug },
    });
    return;
  }

  sendResponse({ published: rest, installed: null });
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
