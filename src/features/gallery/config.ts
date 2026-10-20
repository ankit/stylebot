const DEFAULT_API_URL =
  'https://stylebot-styles.ahuja-ankit.workers.dev/api/v1';

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
  group,
  slug,
}: {
  group: string;
  slug: string;
}): string =>
  `${GALLERY_SITE_URL}/s/${encodeURIComponent(group)}/${encodeURIComponent(
    slug
  )}`;

/**
 * A site group's page on the gallery site, listing its styles.
 */
export const getGallerySiteUrl = (group: string): string =>
  `${GALLERY_SITE_URL}/s/${encodeURIComponent(group)}`;

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
