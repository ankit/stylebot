/**
 * Who publishes styles to the gallery, by an id and a unique username, as a
 * style's author shows them.
 */
export type GalleryAuthor = {
  id: string;
  username: string;
};

/**
 * A style as the gallery lists it, describing its latest version.
 */
export type GalleryStyle = {
  // Numbered in publish order.
  id: number;
  site: string;
  // Fixed at first publish, and not unique: the id is.
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
 * What was published from a Stylebot style's profile: the gallery style, a
 * hash of the CSS its latest version has, and where its gallery page is.
 */
export type GalleryPublished = {
  styleId: number;
  version: number;
  // Compared with hashCss of the profile's CSS to tell if it has changed.
  cssHash: string;
  slug: string;
};

/**
 * The gallery style a profile was installed from, with a hash of the CSS it
 * was installed or last updated with, to tell if the user has edited it.
 */
export type GalleryInstalled = {
  id: number;
  slug: string;
  cssHash: string;
};

/**
 * The version of a gallery style published from here, and whether its
 * profile was edited since.
 */
export type GalleryPublishStatus = {
  version: number;
  changed: boolean;
};

/**
 * A profile handed to the gallery site to publish, as the site bridge gives
 * it: the site and Stylebot style it's for, its CSS and name, a screenshot
 * under the gallery's limit as a data URL, and the gallery style it updates.
 */
export type GalleryDraft = {
  site: string;
  url: string;
  css: string;
  name: string;
  screenshot: string | null;
  styleId: number | null;
};

/**
 * i18n keys for what went wrong, so the editor shows it in the user's
 * language. The server's own message is passed along where it's specific.
 */
export type GalleryErrorKey =
  | 'gallery_error_network'
  | 'gallery_error_invalid'
  | 'gallery_error_not_found'
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
