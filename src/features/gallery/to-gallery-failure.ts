import type { GalleryErrorKey, GalleryFailure } from '@stylebot/types';

import { isGalleryApiError } from './request';

const STATUS_KEYS: Record<number, GalleryErrorKey> = {
  0: 'gallery_error_network',
  400: 'gallery_error_invalid',
  404: 'gallery_error_not_found',
};

/**
 * Turns anything a gallery request threw into a result the editor can show.
 */
export const toGalleryFailure = (e: unknown): GalleryFailure => {
  const errorDetail = e instanceof Error ? e.message : String(e);

  if (isGalleryApiError(e)) {
    return {
      ok: false,
      errorKey: STATUS_KEYS[e.status] ?? 'gallery_error_unknown',
      errorDetail,
    };
  }

  // Sync's errors carry a code; a fetch that never got out is a TypeError.
  if ((e as { code?: unknown })?.code === 'network' || e instanceof TypeError) {
    return { ok: false, errorKey: 'gallery_error_network', errorDetail };
  }

  return { ok: false, errorKey: 'gallery_error_unknown', errorDetail };
};
