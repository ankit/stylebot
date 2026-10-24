import {
  getListedProfiles,
  getListedStyleIds,
  getStyle,
  hashCss,
  isGalleryApiError,
  type GalleryStyleWithCss,
} from '@stylebot/gallery';

import { getLatestVersionListing } from './gallery-preview';
import {
  applyStylesToAllTabs,
  getAll,
  removeStyleGalleryListings,
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
 * A gallery style's latest version, 'missing' on a 404, or null on any
 * other failure.
 */
const getLatestStyle = async (
  id: number
): Promise<GalleryStyleWithCss | 'missing' | null> => {
  try {
    return await getStyle(id);
  } catch (e) {
    return isGalleryApiError(e) && e.status === 404 ? 'missing' : null;
  }
};

/**
 * Updates unedited gallery installs to their latest versions, drops listings
 * of styles the gallery no longer has, and refreshes renamed styles' slugs.
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
      latest === 'missing' ||
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
