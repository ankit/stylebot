import { t } from '@stylebot/i18n';
import type { GalleryFailure } from '@stylebot/types';

/**
 * What to tell the user about a failed gallery request. The gallery writes
 * its 400 messages for people, naming the field that's wrong.
 */
export const galleryErrorText = ({
  errorKey,
  errorDetail,
}: GalleryFailure): string => {
  if (errorKey === 'gallery_error_invalid' && errorDetail) {
    return errorDetail;
  }

  return t(errorKey);
};
