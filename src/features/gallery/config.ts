const DEFAULT_API_URL = 'https://api.stylebot.dev/v1';

// Development builds take STYLEBOT_GALLERY_API_URL, such as a local Worker's.
export const GALLERY_API_URL =
  process.env.STYLEBOT_GALLERY_API_URL || DEFAULT_API_URL;

const DEFAULT_SITE_URL = 'https://gallery.stylebot.dev';

// Development builds take STYLEBOT_GALLERY_SITE_URL, such as a dev server's.
export const GALLERY_SITE_URL =
  process.env.STYLEBOT_GALLERY_SITE_URL || DEFAULT_SITE_URL;

/**
 * A style's page on the gallery site.
 */
export const getGalleryStyleUrl = ({
  id,
  slug,
}: {
  id: number;
  slug: string;
}): string => `${GALLERY_SITE_URL}/style/${id}/${encodeURIComponent(slug)}`;

/**
 * A site's page on the gallery site, listing the styles for its hostname.
 */
export const getGallerySiteUrl = (site: string): string =>
  `${GALLERY_SITE_URL}/site/${encodeURIComponent(site)}`;

/**
 * The gallery site's publish page, filled in from the draft with this id.
 */
export const getGalleryPublishUrl = (draftId: string): string =>
  `${GALLERY_SITE_URL}/publish?${new URLSearchParams({ draft: draftId })}`;

/**
 * A style's edit page on the gallery site.
 */
export const getGalleryEditUrl = (styleId: number): string =>
  `${GALLERY_SITE_URL}/edit/${styleId}`;

/**
 * Whether a value from one of Stylebot's sites is a gallery style id.
 */
export const isGalleryStyleId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0;

export const SCREENSHOT_MAX_BYTES = 1024 * 1024;
