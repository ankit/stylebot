import type { Store } from 'vuex';
import type { State } from 'apps/editor/store';
import { getProfileGalleryListing } from '@stylebot/gallery';
import { isSameGalleryListing, STYLES_KEY } from '@stylebot/saved-styles';
import type { GalleryListing, StyleMap } from '@stylebot/types';

/**
 * The active profile's gallery listing in a snapshot of saved styles.
 */
const getActiveListing = (
  styles: StyleMap | undefined,
  { url, activeProfile }: State
): GalleryListing | undefined => {
  if (!styles) {
    return undefined;
  }

  const listing = getProfileGalleryListing(styles, url, activeProfile);

  return listing ?? undefined;
};

/**
 * Reloads what was published when the profile's gallery listing changes, as
 * it does when the gallery site publishes it from another tab, rather than
 * on every save.
 */
const initGalleryListener = (store: Store<State>): void => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const change = changes[STYLES_KEY];

    if (areaName !== 'local' || !change) {
      return;
    }

    const before = getActiveListing(change.oldValue, store.state);
    const after = getActiveListing(change.newValue, store.state);

    if (!isSameGalleryListing(before, after)) {
      store.dispatch('loadPublishedGalleryStyle');
    }
  });
};

export default initGalleryListener;
