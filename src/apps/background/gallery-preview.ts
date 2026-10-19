import {
  GALLERY_PREVIEW_SITES_KEY,
  getInstallId,
  getInstalledProfile,
  getPublishedProfile,
  getStyle,
  hashCss,
  recordInstall,
  toGallerySite,
  type GalleryStyleToInstall,
  type ListedProfile,
} from '@stylebot/gallery';
import { compileStyle } from '@stylebot/css';
import { getStylesForPage } from '@stylebot/saved-styles';
import type {
  GalleryPreview,
  GalleryStyle,
  GalleryStyleInstalled,
  HideGalleryPreview,
  GalleryListing,
  ShowGalleryPreview,
  StyleMap,
  StyleWithoutUrl,
  TabMessage,
} from '@stylebot/types';

import {
  applyStylesToAllTabs,
  getAll,
  installProfile,
  reinstallProfile,
  removeGalleryListing,
  restoreStyles,
} from './styles';

// Each tab's preview, by tab id.
const PREVIEWS_KEY = 'galleryPreviews';

// Each tab's latest install, with the styles it changed as they were before.
const INSTALL_UNDOS_KEY = 'galleryInstallUndos';

type Previews = Record<string, GalleryPreview>;

type InstallUndo = {
  preview: GalleryPreview;
  styles: Record<string, StyleWithoutUrl | null>;
};

type InstallUndos = Record<string, InstallUndo>;

const readInstallUndos = async (): Promise<InstallUndos> => {
  const items = await chrome.storage.session.get(INSTALL_UNDOS_KEY);
  return items[INSTALL_UNDOS_KEY] ?? {};
};

const writeInstallUndos = (undos: InstallUndos): Promise<void> =>
  chrome.storage.session.set({ [INSTALL_UNDOS_KEY]: undos });

const readPreviews = async (): Promise<Previews> => {
  const items = await chrome.storage.session.get(PREVIEWS_KEY);
  return items[PREVIEWS_KEY] ?? {};
};

/**
 * Saves the previews, and the sites they're on for pages to check.
 */
const writePreviews = async (previews: Previews): Promise<void> => {
  const sites = [
    ...new Set(Object.values(previews).map(preview => preview.style.site)),
  ];

  await chrome.storage.session.set({ [PREVIEWS_KEY]: previews });
  await chrome.storage.local.set({ [GALLERY_PREVIEW_SITES_KEY]: sites });
};

/**
 * Whether a url is on a gallery site.
 */
const isOnSite = (url: string | undefined, site: string): boolean => {
  try {
    return toGallerySite(new URL(url ?? '').hostname) === site;
  } catch {
    return false;
  }
};

/**
 * Tells a tab, which may have no Stylebot script to answer.
 */
const sendToTab = (tabId: number, message: TabMessage): void =>
  chrome.tabs.sendMessage(tabId, message, () => chrome.runtime.lastError);

export const getGalleryPreview = async (
  tabId: number
): Promise<GalleryPreview | null> => (await readPreviews())[tabId] ?? null;

/**
 * Tells a tab on a web page to show its preview, with the saved style that
 * installing it would replace there.
 */
const showOnTab = async (
  tabId: number,
  preview: GalleryPreview
): Promise<void> => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);

  if (!tab?.url || !/^https?:/.test(tab.url)) {
    return;
  }

  const replacedUrl = await getReplacedStyleUrl(preview.style, tab.url);
  const message: ShowGalleryPreview = {
    name: 'ShowGalleryPreview',
    preview,
    replacedUrl,
  };

  sendToTab(tabId, message);
};

/**
 * Saves a tab's preview and shows it there.
 */
const showPreview = async (
  tabId: number,
  preview: GalleryPreview
): Promise<void> => {
  const previews = await readPreviews();

  await writePreviews({ ...previews, [tabId]: preview });
  await showOnTab(tabId, preview);
};

// The latest preview asked for in each tab, so a slower earlier one is dropped.
const latestRequests = new Map<number, number>();

/**
 * Previews a gallery style on a tab until it's installed, cancelled, or the
 * tab leaves the style's site. Shows it now if the tab is already there.
 */
export const startGalleryPreview = async (
  tabId: number,
  id: string,
  galleryTabId?: number
): Promise<GalleryPreview | null> => {
  const request = (latestRequests.get(tabId) ?? 0) + 1;
  latestRequests.set(tabId, request);

  const { css: source, ...style } = await getStyle(id);
  const { css, importUrls } = compileStyle(source, { forceImportant: true });

  if (latestRequests.get(tabId) !== request) {
    return null;
  }

  const preview: GalleryPreview = { style, css, importUrls, galleryTabId };

  await showPreview(tabId, preview);
  return preview;
};

/**
 * Opens a gallery style's site in a new tab beside the gallery page, and
 * previews the style there.
 */
export const openGalleryPreview = async (
  id: string,
  galleryTab: chrome.tabs.Tab
): Promise<void> => {
  const { site } = await getStyle(id);

  // Blank first, so the preview is saved before the site's first page asks.
  const tab = await chrome.tabs.create({
    url: 'about:blank',
    index: galleryTab.index + 1,
    openerTabId: galleryTab.id,
    windowId: galleryTab.windowId,
  });

  if (tab.id === undefined) {
    return;
  }

  await startGalleryPreview(tab.id, id, galleryTab.id);
  await chrome.tabs.update(tab.id, { url: `https://${site}/` });
};

/**
 * Forgets a tab's preview, and tells the tab to put its own styles back
 * unless it's gone or already left the site.
 */
export const endGalleryPreview = async (
  tabId: number,
  { notifyTab = true, installed = false } = {}
): Promise<void> => {
  const { [tabId]: preview, ...rest } = await readPreviews();

  if (!preview) {
    return;
  }

  await writePreviews(rest);

  if (notifyTab) {
    const message: HideGalleryPreview = {
      name: 'HideGalleryPreview',
      installed,
    };

    sendToTab(tabId, message);
  }
};

/**
 * A profile to switch back to, with the css and listing to update it to when
 * it's out of date.
 */
type ReusableProfile = {
  url: string;
  profileId: string;
  css?: string;
  galleryListing?: GalleryListing;
};

/**
 * The gallery listing for a profile installed at the style's latest version.
 */
const getLatestVersionListing = (
  { id, group, slug }: GalleryStyle,
  { version, css }: GalleryStyleToInstall
): GalleryListing => ({
  styleId: id,
  group,
  slug,
  version,
  cssHash: hashCss(css),
});

/**
 * Whether installing a version switches back to the profile it was installed
 * as: it's at that version, or older and unedited so it's updated in place.
 */
const canReuseInstall = (
  { css, galleryListing }: ListedProfile,
  version: number
): boolean =>
  galleryListing.version >= version || hashCss(css) === galleryListing.cssHash;

/**
 * The installed profile to switch back to, updated to the latest version
 * when it's out of date and unedited. Null when the user edited a profile
 * that's out of date, so the latest goes beside it.
 */
const reuseInstalledProfile = (
  installed: ListedProfile,
  style: GalleryStyle,
  latest: GalleryStyleToInstall
): ReusableProfile | null => {
  const { url, profileId, galleryListing } = installed;

  if (!canReuseInstall(installed, latest.version)) {
    return null;
  }

  if (galleryListing.version >= latest.version) {
    return { url, profileId };
  }

  return {
    url,
    profileId,
    css: latest.css,
    galleryListing: getLatestVersionListing(style, latest),
  };
};

/**
 * The profile to switch back to for a gallery style: the one it was installed
 * as, or else the one it was published from, which is the user's own and
 * kept as it is.
 */
const findReusableProfile = (
  styles: StyleMap,
  style: GalleryStyle,
  latest: GalleryStyleToInstall
): ReusableProfile | null => {
  const installed = getInstalledProfile(styles, style.id);
  const reusable = installed && reuseInstalledProfile(installed, style, latest);

  if (reusable) {
    return reusable;
  }

  const published = getPublishedProfile(styles, style.id);

  if (published) {
    return { url: published.url, profileId: published.profileId };
  }

  return null;
};

/**
 * Installs a gallery style's latest version: into the profile it was
 * installed or published as here, or else as a new profile of pageUrl's
 * style. Resolves with the profile's name.
 */
const installLatestVersion = async (
  style: GalleryStyle,
  latest: GalleryStyleToInstall,
  pageUrl: string
): Promise<string> => {
  const styles = await getAll();
  const reusable = findReusableProfile(styles, style, latest);

  if (reusable) {
    const { url, profileId, css, galleryListing } = reusable;
    const name = await reinstallProfile(url, profileId, {
      css,
      galleryListing,
    });

    if (name !== null) {
      return name;
    }
  }

  // The edited install stays the user's, so only the new profile keeps the listing.
  const installed = getInstalledProfile(styles, style.id);

  if (installed) {
    await removeGalleryListing(installed.url, installed.profileId);
  }

  const profile = await installProfile(pageUrl, {
    name: latest.name,
    css: latest.css,
    galleryListing: getLatestVersionListing(style, latest),
  });

  return profile.name;
};

/**
 * The saved style a new profile for a page goes in: the first that matches
 * it, or else one for its host.
 */
const getPageStyleUrl = (pageUrl: string, styles: StyleMap): string =>
  getStylesForPage(pageUrl, styles).styles[0]?.url ?? new URL(pageUrl).hostname;

/**
 * The saved style that installing a gallery style from a page goes in, which
 * a preview there replaces while the page's other styles stay.
 */
export const getReplacedStyleUrl = async (
  style: GalleryStyle,
  pageUrl: string
): Promise<string> => {
  const styles = await getAll();
  const installed = getInstalledProfile(styles, style.id);

  if (installed && canReuseInstall(installed, style.version)) {
    return installed.url;
  }

  return (
    getPublishedProfile(styles, style.id)?.url ??
    getPageStyleUrl(pageUrl, styles)
  );
};

/**
 * Remembers the styles a tab's install changed, as they were, so it can be
 * undone.
 */
const rememberInstall = async (
  tabId: number,
  preview: GalleryPreview,
  before: StyleMap,
  after: StyleMap
): Promise<void> => {
  const urls = new Set([...Object.keys(before), ...Object.keys(after)]);
  const styles: InstallUndo['styles'] = {};

  urls.forEach(url => {
    if (JSON.stringify(before[url]) !== JSON.stringify(after[url])) {
      styles[url] = before[url] ?? null;
    }
  });

  const undos = await readInstallUndos();
  await writeInstallUndos({ ...undos, [tabId]: { preview, styles } });
};

/**
 * Forgets a tab's install, once it's closed.
 */
export const forgetGalleryInstall = async (tabId: number): Promise<void> => {
  const { [tabId]: undo, ...rest } = await readInstallUndos();

  if (undo) {
    await writeInstallUndos(rest);
  }
};

/**
 * Puts back the styles a tab's latest install changed, and previews the
 * style there again.
 */
export const undoGalleryInstall = async (tabId: number): Promise<void> => {
  const { [tabId]: undo, ...rest } = await readInstallUndos();

  if (!undo) {
    throw new Error('No install to undo');
  }

  await writeInstallUndos(rest);

  // Previewing first keeps the tab from showing the restored styles meanwhile.
  await showPreview(tabId, undo.preview);
  await restoreStyles(undo.styles);
  await applyStylesToAllTabs();
};

/**
 * Installs a tab's preview the way the popup would, then ends the preview
 * and tells the gallery page.
 */
export const installGalleryPreview = async (tabId: number): Promise<string> => {
  const preview = await getGalleryPreview(tabId);

  if (!preview) {
    throw new Error('No preview to install');
  }

  const tab = await chrome.tabs.get(tabId);
  const pageUrl = getPageStyleUrl(tab.url ?? '', await getAll());

  const latest = await recordInstall(preview.style.id, await getInstallId());
  const before = await getAll();
  const profileName = await installLatestVersion(
    preview.style,
    latest,
    pageUrl
  );

  await rememberInstall(tabId, preview, before, await getAll());

  await endGalleryPreview(tabId, { installed: true });
  await applyStylesToAllTabs();

  if (preview.galleryTabId !== undefined) {
    const message: GalleryStyleInstalled = {
      name: 'GalleryStyleInstalled',
      id: preview.style.id,
      profileName,
    };

    sendToTab(preview.galleryTabId, message);
  }

  return profileName;
};

/**
 * Ends a tab's preview once it navigates off the style's site.
 */
export const endGalleryPreviewOffSite = async (
  tabId: number,
  url: string
): Promise<void> => {
  if (!/^https?:/.test(url)) {
    return;
  }

  const preview = await getGalleryPreview(tabId);

  if (preview && !isOnSite(url, preview.style.site)) {
    await endGalleryPreview(tabId, { notifyTab: false });
  }
};

/**
 * Drops the sites of previews a browser restart or update has forgotten.
 */
export const syncGalleryPreviewSites = async (): Promise<void> =>
  writePreviews(await readPreviews());
