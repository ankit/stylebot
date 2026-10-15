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

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 200;
export const DISPLAY_NAME_MAX_LENGTH = 40;
export const SCREENSHOT_MAX_BYTES = 1024 * 1024;
