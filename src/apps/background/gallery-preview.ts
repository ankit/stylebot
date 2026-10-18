import {
  GALLERY_PREVIEW_SITES_KEY,
  getInstallId,
  getInstalledStyle,
  getPublishedProfile,
  getStyle,
  hashCss,
  recordInstall,
  rememberInstalledStyle,
  toGallerySite,
  type GalleryInstall,
} from '@stylebot/gallery';
import { compileStyle } from '@stylebot/css';
import { getProfileSheet, getStylesForPage } from '@stylebot/saved-styles';
import type {
  GalleryPreview,
  GalleryStyle,
  GalleryStyleInstalled,
  HideGalleryPreview,
  ShowGalleryPreview,
  StyleMap,
  TabMessage,
} from '@stylebot/types';

import {
  applyStylesToAllTabs,
  getAll,
  installProfile,
  reinstallProfile,
} from './styles';

// Each tab's preview, by tab id.
const PREVIEWS_KEY = 'galleryPreviews';

type Previews = Record<string, GalleryPreview>;

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
  const previews = await readPreviews();

  await writePreviews({ ...previews, [tabId]: preview });

  const message: ShowGalleryPreview = { name: 'ShowGalleryPreview', preview };
  sendToTab(tabId, message);

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
  { notifyTab = true } = {}
): Promise<void> => {
  const { [tabId]: preview, ...rest } = await readPreviews();

  if (!preview) {
    return;
  }

  await writePreviews(rest);

  if (notifyTab) {
    const message: HideGalleryPreview = { name: 'HideGalleryPreview' };
    sendToTab(tabId, message);
  }
};

type ProfileRef = { url: string; profileId: string };

// A profile to switch back to, and the css to update it to, if any.
type ReusableProfile = ProfileRef & { css?: string };

/**
 * The profile this gallery style was installed as, with the latest css when
 * it's out of date and unedited. Null when there's no install, its profile
 * is gone, or the user edited a profile that's out of date.
 */
const findInstalledProfile = async (
  styleId: string,
  latest: GalleryInstall,
  styles: StyleMap
): Promise<ReusableProfile | null> => {
  const installed = await getInstalledStyle(styleId);

  if (!installed) {
    return null;
  }

  const { url, profileId } = installed;
  const css = getProfileSheet(styles[url], profileId)?.css;

  if (css === undefined) {
    return null;
  }

  if (installed.version >= latest.version) {
    return { url, profileId };
  }

  if (hashCss(css) === installed.cssHash) {
    return { url, profileId, css: latest.css };
  }

  return null;
};

/**
 * The profile the style was published from here. It's the user's own, so
 * it's switched back to as it is.
 */
const findPublishedProfile = async (
  styleId: string,
  styles: StyleMap
): Promise<ReusableProfile | null> => {
  const published = await getPublishedProfile(styleId);

  if (!published) {
    return null;
  }

  const sheet = getProfileSheet(styles[published.url], published.profileId);
  return sheet ? published : null;
};

/**
 * Remembers the profile a gallery style is installed as, at its latest version.
 */
const rememberInstall = (
  { id, group, slug }: GalleryStyle,
  latest: GalleryInstall,
  { url, profileId }: ProfileRef
) =>
  rememberInstalledStyle(id, {
    url,
    profileId,
    version: latest.version,
    group,
    slug,
    cssHash: hashCss(latest.css),
  });

/**
 * Installs a gallery style's latest version: into the profile it was
 * installed or published as here, or else as a new profile of pageUrl's
 * style. Resolves with the profile's name.
 */
const installLatestVersion = async (
  style: GalleryStyle,
  latest: GalleryInstall,
  pageUrl: string
): Promise<string> => {
  const styles = await getAll();
  const reusable =
    (await findInstalledProfile(style.id, latest, styles)) ??
    (await findPublishedProfile(style.id, styles));

  if (reusable) {
    const { url, profileId, css } = reusable;
    const name = await reinstallProfile(url, profileId, css);

    if (name !== null) {
      if (css !== undefined) {
        await rememberInstall(style, latest, reusable);
      }

      return name;
    }
  }

  const profile = await installProfile(pageUrl, {
    name: latest.name,
    css: latest.css,
  });
  await rememberInstall(style, latest, { url: pageUrl, profileId: profile.id });

  return profile.name;
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
  const { styles } = getStylesForPage(tab.url ?? '', await getAll());
  const pageUrl = styles[0]?.url ?? new URL(tab.url ?? '').hostname;

  const latest = await recordInstall(preview.style.id, await getInstallId());
  const profileName = await installLatestVersion(
    preview.style,
    latest,
    pageUrl
  );

  await endGalleryPreview(tabId);
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
