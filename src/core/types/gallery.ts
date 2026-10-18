/**
 * Who publishes styles to the gallery, by an anonymous id and an optional
 * alias. Both a signed-in account and a style's author have this shape.
 */
export type GalleryAuthor = {
  id: string;
  name: string | null;
};

/**
 * Whether one of the author's own styles is listed, or hidden after
 * reports until it's looked at.
 */
export type GalleryStyleStatus = 'live' | 'hidden';

/**
 * A style as the gallery lists it, describing its latest version.
 */
export type GalleryStyle = {
  id: string;
  site: string;
  // The gallery's site group, such as wikipedia for any Wikipedia.
  group: string;
  // Unique within the group and fixed at first publish.
  slug: string;
  name: string;
  description: string | null;
  author: GalleryAuthor;
  version: number;
  installs: number;
  createdAt: number;
  updatedAt: number;
  // A path on the gallery's server, for the latest version.
  screenshot: string;
  // Only on the author's own styles.
  status?: GalleryStyleStatus;
};

/**
 * A gallery style a tab is previewing, compiled to apply in place of the
 * page's own styles while the tab stays on its site.
 */
export type GalleryPreview = {
  style: GalleryStyle;
  css: string;
  importUrls: Array<string>;
  // The gallery page it was opened from, told when it's installed.
  galleryTabId?: number;
};

/**
 * A style as publishing returns it, with what the server took out of the CSS
 * so the author can see it.
 */
export type GalleryPublishedStyle = GalleryStyle & {
  removed: Array<string>;
};

/**
 * What was published from a Stylebot style's profile: the gallery style, a
 * hash of the CSS its latest version has, and where its gallery page is.
 */
export type GalleryPublished = {
  styleId: string;
  version: number;
  // Compared with hashCss of the profile's CSS to tell if it has changed.
  cssHash: string;
  group: string;
  slug: string;
};

/**
 * i18n keys for what went wrong, so the editor shows it in the user's
 * language. The server's own message is passed along where it's specific.
 */
export type GalleryErrorKey =
  | 'gallery_error_sign_in'
  | 'gallery_error_network'
  | 'gallery_error_invalid'
  | 'gallery_error_not_yours'
  | 'gallery_error_not_found'
  | 'gallery_error_conflict'
  | 'gallery_error_screenshot_too_large'
  | 'gallery_error_screenshot'
  | 'gallery_error_unknown';

/**
 * A gallery request that failed, with what to tell the user.
 */
export type GalleryFailure = {
  ok: false;
  errorKey: GalleryErrorKey;
  errorDetail?: string;
};

/**
 * What a gallery message answers with: its result, or why it failed.
 */
export type GalleryResult<T = unknown> = ({ ok: true } & T) | GalleryFailure;
