import type { StyleWithoutUrl } from '@stylebot/types';
import { collapseProfiles, expandProfiles } from '@stylebot/saved-styles';

/**
 * The style with any gallery listings only the other copy's profiles have.
 * Each device drops stale listings itself, so a missing one isn't a removal.
 */
export const fillGalleryListings = (
  side: StyleWithoutUrl | undefined,
  other: StyleWithoutUrl | undefined
): StyleWithoutUrl | undefined => {
  if (!side?.profiles || !other?.profiles) {
    return side;
  }

  const { active, sheets } = expandProfiles(side);
  const otherSheets = expandProfiles(other).sheets;
  const missing = Object.keys(sheets).filter(
    id => !sheets[id].galleryListing && otherSheets[id]?.galleryListing
  );

  if (missing.length === 0) {
    return side;
  }

  const filled = { ...sheets };
  missing.forEach(id => {
    filled[id] = {
      ...sheets[id],
      galleryListing: otherSheets[id].galleryListing,
    };
  });

  return collapseProfiles(side, { active, sheets: filled });
};
