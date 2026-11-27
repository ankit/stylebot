import {
  galleryApiError,
  getListedProfiles,
  getListedStyleIds,
  getStyle,
  hashCss,
  isGalleryStyleDeleted,
  type GalleryStyleWithCss,
  type ListedProfile,
} from '@stylebot/gallery';

import { getLatestVersionListing } from './gallery-preview';
import {
  applyStylesToAllTabs,
  getAll,
  removeStyleGalleryListings,
  resetGalleryProfile,
  setGalleryListing,
  updateGalleryProfile,
} from './styles';

const GALLERY_UPDATES_ALARM = 'gallery-updates';
const GALLERY_UPDATES_PERIOD_MINUTES = 24 * 60;

export const isGalleryUpdatesAlarm = (name: string): boolean =>
  name === GALLERY_UPDATES_ALARM;

/**
 * Checks installed gallery styles for updates once a day. Runs on every
 * service worker start, so an existing alarm is left alone rather than
 * replaced, which would restart its countdown.
 */
export const scheduleGalleryUpdates = async (): Promise<void> => {
  const alarm = await chrome.alarms.get(GALLERY_UPDATES_ALARM);

  if (!alarm) {
    chrome.alarms.create(GALLERY_UPDATES_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: GALLERY_UPDATES_PERIOD_MINUTES,
    });
  }
};

/**
 * A gallery style's latest version, 'deleted' once the gallery deleted it,
 * or null on any other failure, a hidden or unpublished style among them.
 */
const getLatestStyle = async (
  id: number
): Promise<GalleryStyleWithCss | 'deleted' | null> => {
  try {
    return await getStyle(id);
  } catch (e) {
    return isGalleryStyleDeleted(e) ? 'deleted' : null;
  }
};

/**
 * Updates unedited gallery installs to their latest versions, drops listings
 * of styles the gallery deleted, and refreshes renamed styles' slugs. Hidden
 * and unpublished styles keep their listings, as they can come back.
 */
export const updateGalleryInstalls = async (): Promise<void> => {
  const styles = await getAll();
  let updated = false;

  for (const styleId of getListedStyleIds(styles)) {
    const listed = getListedProfiles(styles, styleId);
    const latest = await getLatestStyle(styleId);

    if (latest === null) {
      continue;
    }

    // Versions only grow, so an older one means the id now names another style.
    if (
      latest === 'deleted' ||
      latest.version < listed[0].galleryListing.version
    ) {
      await removeStyleGalleryListings(styleId);
      continue;
    }

    for (const { url, profileId, css, galleryListing: current } of listed) {
      const isOutdated =
        current.version < latest.version && hashCss(css) === current.cssHash;

      if (isOutdated) {
        const galleryListing = getLatestVersionListing(
          latest,
          latest,
          current.published
        );

        await updateGalleryProfile(url, profileId, latest.css, galleryListing);
        updated = true;
      } else if (current.slug !== latest.slug) {
        await setGalleryListing(url, profileId, {
          ...current,
          slug: latest.slug,
        });
      }
    }
  }

  if (updated) {
    await applyStylesToAllTabs();
  }
};

/**
 * Whether a profile's CSS changed since it was installed or last updated.
 */
const isEdited = ({ css, galleryListing }: ListedProfile): boolean =>
  hashCss(css) !== galleryListing.cssHash;

/**
 * Updates the profiles a gallery style was installed as to its latest
 * version and applies it, resolving with that version. Refuses edited
 * profiles unless their edits are to be dropped.
 */
export const updateGalleryInstall = async (
  styleId: number,
  discardEdits: boolean
): Promise<number> => {
  const installed = getListedProfiles(await getAll(), styleId).filter(
    ({ galleryListing }) => !galleryListing.published
  );

  if (installed.length === 0) {
    throw new Error('The style isn’t installed');
  }

  if (!discardEdits && installed.some(isEdited)) {
    throw new Error('The style was edited since it was installed');
  }

  const latest = await getStyle(styleId).catch(async e => {
    if (isGalleryStyleDeleted(e)) {
      await removeStyleGalleryListings(styleId);
    }

    throw e;
  });

  // Versions only grow, so an older one means the id now names another style.
  if (latest.version < installed[0].galleryListing.version) {
    await removeStyleGalleryListings(styleId);
    throw galleryApiError('The style is gone from the gallery', 404);
  }

  const galleryListing = getLatestVersionListing(latest, latest);
  const update = discardEdits ? resetGalleryProfile : updateGalleryProfile;

  for (const { url, profileId } of installed) {
    await update(url, profileId, latest.css, galleryListing);
  }

  await applyStylesToAllTabs();

  return latest.version;
};
