import {
  getListedProfileNames,
  getListedStyleIds,
  getSiteStyles,
  getStyle,
  getProfileGalleryListing,
  isGalleryStyleId,
  isPublicSite,
  getSuggestionSites,
  toGalleryFailure,
  toGallerySite,
} from '@stylebot/gallery';
import type {
  CaptureGalleryScreenshot as CaptureGalleryScreenshotType,
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
import { getAll } from './styles';
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
 * Captures a tab as it shows now, at full size.
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
 * The gallery style a profile was installed from, without asking the
 * gallery.
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

  const { styleId, slug } = listing;
  sendResponse({ published: null, installed: { id: styleId, slug } });
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
