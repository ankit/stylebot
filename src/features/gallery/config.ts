const DEFAULT_API_URL = 'https://api.stylebot.dev/v1';

// Development builds take STYLEBOT_GALLERY_API_URL, such as a local Worker's.
export const GALLERY_API_URL =
  process.env.STYLEBOT_GALLERY_API_URL || DEFAULT_API_URL;

/**
 * The full URL of a path the API returns, such as a style's screenshot.
 */
export const getGalleryUrl = (path: string): string =>
  new URL(path, GALLERY_API_URL).href;

export const GALLERY_SITE_URL = 'https://gallery.stylebot.dev';

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
 * Whether a value from one of Stylebot's sites is a gallery style id.
 */
export const isGalleryStyleId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0;

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 200;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/**
 * Whether a username follows the gallery's rule: lowercase letters and
 * numbers, with single hyphens between them.
 */
export const isValidUsername = (username: string): boolean =>
  username.length >= USERNAME_MIN_LENGTH &&
  username.length <= USERNAME_MAX_LENGTH &&
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(username);
export const SCREENSHOT_MAX_BYTES = 1024 * 1024;

// The code the gallery refuses a new version with when its CSS is the latest's.
export const CSS_UNCHANGED = 'css_unchanged';
