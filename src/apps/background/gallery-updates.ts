import {
  getListedProfiles,
  getListedStyleIds,
  getStyle,
  hashCss,
  type GalleryStyleWithCss,
} from '@stylebot/gallery';

import { getLatestVersionListing } from './gallery-preview';
import { applyStylesToAllTabs, getAll, updateGalleryProfile } from './styles';

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
 * A gallery style's latest version, or null when the gallery can't give it,
 * such as for a style that's hidden or unpublished.
 */
const getLatestStyle = async (
  id: number
): Promise<GalleryStyleWithCss | null> => {
  try {
    return await getStyle(id);
  } catch {
    return null;
  }
};

/**
 * Updates the installed gallery styles that haven't been edited to their
 * latest versions, and applies them to open tabs if any changed. Edited
 * profiles keep the version they're at.
 */
export const updateGalleryInstalls = async (): Promise<void> => {
  const styles = await getAll();
  let updated = false;

  for (const styleId of getListedStyleIds(styles)) {
    const unedited = getListedProfiles(styles, styleId).filter(
      ({ css, galleryListing }) => hashCss(css) === galleryListing.cssHash
    );

    if (unedited.length === 0) {
      continue;
    }

    const latest = await getLatestStyle(styleId);

    if (!latest) {
      continue;
    }

    const galleryListing = getLatestVersionListing(latest, latest);

    for (const { url, profileId, galleryListing: current } of unedited) {
      if (current.version < latest.version) {
        await updateGalleryProfile(url, profileId, latest.css, galleryListing);
        updated = true;
      }
    }
  }

  if (updated) {
    await applyStylesToAllTabs();
  }
};
