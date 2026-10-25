import {
  blobToDataUrl,
  compressScreenshot,
  deleteGalleryDraft,
  getGalleryDraft,
  getGalleryPublishUrl,
  getListedProfileNames,
  getListedStyleIds,
  getSiteSuggestions,
  getStyle,
  getProfileGalleryListing,
  getPublishedProfile,
  getPublishedStatus,
  hashCss,
  isGalleryApiError,
  isGalleryStyleId,
  isPublicSite,
  newGalleryDraftId,
  getSuggestionSites,
  saveGalleryDraft,
  toGalleryFailure,
  toGallerySite,
} from '@stylebot/gallery';
import { expandProfiles } from '@stylebot/saved-styles';
import type {
  CaptureGalleryScreenshot as CaptureGalleryScreenshotType,
  OpenGalleryDraft as OpenGalleryDraftType,
  OpenGalleryDraftResponse,
  PublishProfileToGallery as PublishProfileToGalleryType,
  GetGalleryDraft as GetGalleryDraftType,
  GetGalleryDraftResponse,
  GalleryDraftPublished as GalleryDraftPublishedType,
  GalleryDraftPublishedResponse,
  GalleryStyleDeleted as GalleryStyleDeletedType,
  GalleryStyleDeletedResponse,
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
  PublishGalleryStyleUpdate as PublishGalleryStyleUpdateType,
  ResetGalleryProfile as ResetGalleryProfileType,
  ResetGalleryProfileResponse,
  GalleryScreenshotResponse,
} from '@stylebot/types';

import { captureTab } from './capture-tab';
import {
  applyStylesToAllTabs,
  enable,
  getAll,
  removeStyleGalleryListings,
  resetGalleryProfile,
  setActiveProfile,
  setGalleryListing,
} from './styles';
import {
  endGalleryPreview,
  getGalleryPreview,
  getInstallTargetUrl,
  getLatestVersionListing,
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

// Drafts the publish page may ask for while their screenshot is still fitted.
const pendingDrafts = new Map<string, Promise<void>>();

/**
 * Opens a page in a new tab, beside the one it was asked from.
 */
const openInNewTab = (
  url: string,
  openerTabId: number | undefined
): Promise<chrome.tabs.Tab> =>
  chrome.tabs.create({
    url,
    ...(openerTabId !== undefined ? { openerTabId } : {}),
  });

/**
 * Shows the gallery's publish page on a profile, then saves it as the draft
 * the page reads.
 */
const openDraft = async (
  {
    url,
    profileId,
    css,
    profileName,
    screenshot,
  }: Omit<OpenGalleryDraftType, 'name'>,
  showPublishPage: (url: string) => Promise<unknown>
): Promise<void> => {
  const id = newGalleryDraftId();
  const saved = (async () => {
    const savedStyles = await getAll();
    const listing = getProfileGalleryListing(savedStyles, url, profileId);

    await saveGalleryDraft(id, {
      site: url,
      url,
      profileId,
      css,
      name: profileName,
      screenshot: await fitScreenshot(screenshot),
      styleId: listing?.published ? listing.styleId : null,
    });
  })();

  pendingDrafts.set(id, saved);

  try {
    await showPublishPage(getGalleryPublishUrl(id));
  } finally {
    await saved.finally(() => pendingDrafts.delete(id));
  }
};

export const OpenGalleryDraft = async (
  { name: _name, ...draft }: OpenGalleryDraftType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: OpenGalleryDraftResponse) => void
): Promise<void> => {
  try {
    await openDraft(draft, url => openInNewTab(url, sender.tab?.id));
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

// Long enough for a tab to paint a profile it was just switched to.
const PROFILE_PAINT_MS = 300;

/**
 * Captures a tab, or resolves with null when it can't be, so the gallery site
 * asks for a screenshot instead.
 */
const captureOrNull = async (tabId: number): Promise<string | null> => {
  try {
    return await captureTab(await chrome.tabs.get(tabId));
  } catch (e) {
    fail(e);
    return null;
  }
};

/**
 * Publishes a profile without opening the editor, capturing the tab when
 * there is one.
 */
export const PublishProfileToGallery = async (
  { tabId, url, profileId }: PublishProfileToGalleryType,
  sendResponse: (response: OpenGalleryDraftResponse) => void
): Promise<void> => {
  try {
    const style = (await getAll())[url];
    const expanded = style && expandProfiles(style);
    const sheet = expanded?.sheets[profileId];

    if (!expanded || !sheet) {
      throw new Error('No profile to publish');
    }

    const showsProfile = expanded.active === profileId && style.enabled;

    if (tabId !== undefined && !showsProfile) {
      await setActiveProfile(url, profileId);
      await enable(url);
      await applyStylesToAllTabs();
      await new Promise(resolve => setTimeout(resolve, PROFILE_PAINT_MS));
    }

    await openDraft(
      {
        url,
        profileId,
        css: sheet.css,
        profileName: sheet.name,
        screenshot: tabId === undefined ? null : await captureOrNull(tabId),
      },
      url => openInNewTab(url, tabId)
    );
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
};

/**
 * Takes the gallery's tab to the publish page on the profile published as a
 * style, without a screenshot: the gallery keeps the style's own.
 */
export const PublishGalleryStyleUpdate = async (
  { styleId }: PublishGalleryStyleUpdateType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: OpenGalleryDraftResponse) => void
): Promise<void> => {
  try {
    if (!isFromGallery(sender) || !isGalleryStyleId(styleId)) {
      throw new Error('Publish refused');
    }

    const tabId = sender.tab?.id;

    if (tabId === undefined) {
      throw new Error('No tab to publish from');
    }

    const profile = getPublishedProfile(await getAll(), styleId);

    if (!profile) {
      throw new Error('No single profile published as the style');
    }

    await openDraft(
      {
        url: profile.url,
        profileId: profile.profileId,
        css: profile.css,
        profileName: profile.name,
        screenshot: null,
      },
      url => chrome.tabs.update(tabId, { url })
    );
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

  await pendingDrafts.get(id)?.catch(() => undefined);
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
 * Forgets a style the gallery site deleted, so profiles published or
 * installed from it no longer link to it. Their CSS stays.
 */
export const GalleryStyleDeleted = async (
  { styleId }: GalleryStyleDeletedType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GalleryStyleDeletedResponse) => void
): Promise<void> => {
  if (!isFromGallery(sender) || !isGalleryStyleId(styleId)) {
    sendResponse({ ok: false });
    return;
  }

  try {
    await removeStyleGalleryListings(styleId);
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
      installed: { id: rest.styleId, slug: rest.slug, cssHash: rest.cssHash },
    });
    return;
  }

  sendResponse({ published: rest, installed: null });
};

/**
 * Puts the latest version of the gallery style a profile was installed from
 * back in it, and applies it to open tabs. Drops the style's listings when
 * the gallery no longer has it, as the daily update check does.
 */
export const ResetGalleryProfile = async (
  { url, profileId }: ResetGalleryProfileType,
  sendResponse: (response: ResetGalleryProfileResponse) => void
): Promise<void> => {
  try {
    const savedStyles = await getAll();
    const listing = getProfileGalleryListing(savedStyles, url, profileId);

    if (!listing) {
      throw new Error('The profile wasn’t installed from the gallery');
    }

    const latest = await getStyle(listing.styleId).catch(async e => {
      if (isGalleryApiError(e) && e.status === 404) {
        await removeStyleGalleryListings(listing.styleId);
      }

      throw e;
    });

    // Versions only grow, so an older one means the id now names another style.
    if (latest.version < listing.version) {
      await removeStyleGalleryListings(listing.styleId);
      sendResponse({ ok: false, errorKey: 'gallery_error_not_found' });
      return;
    }

    const galleryListing = getLatestVersionListing(
      latest,
      latest,
      listing.published
    );

    await resetGalleryProfile(url, profileId, latest.css, galleryListing);
    await applyStylesToAllTabs();
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse(fail(e));
  }
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
      sendResponse({ ok: true, styles: [], total: 0, site });
      return;
    }

    const [{ styles, total }, listed] = await Promise.all([
      getSiteSuggestions(site, SUGGESTIONS_FETCHED),
      getAll().then(getListedStyleIds),
    ]);

    sendResponse({
      ok: true,
      styles: styles.filter(style => !listed.has(style.id)),
      total,
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
 * for the site bridge on Stylebot's own sites, and for the gallery alone,
 * which were published from here.
 */
export const GetGalleryInstallStatus = async (
  { styleIds }: GetGalleryInstallStatusType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetGalleryInstallStatusResponse) => void
): Promise<void> => {
  const fromSiteBridge =
    sender.id === chrome.runtime.id && isStylebotSite(sender.url);

  if (!fromSiteBridge || !Array.isArray(styleIds)) {
    sendResponse({ installed: {}, published: {} });
    return;
  }

  const maxStyles = 100;
  const ids = styleIds.filter(isGalleryStyleId).slice(0, maxStyles);
  const savedStyles = await getAll();

  sendResponse({
    installed: getListedProfileNames(savedStyles, ids),
    published: isGallerySite(sender.url)
      ? getPublishedStatus(savedStyles, ids)
      : {},
  });
};
