import type { Timestamp } from './shared';

/**
 * One of a style's alternative stylesheets. The active profile's css lives
 * in the style's own css, so its entry here holds only the name. Fields a
 * newer Stylebot adds are kept as they are, so they survive this version.
 */
export type StyleProfile = {
  name: string;
  css?: string;
  galleryListing?: GalleryListing;
  // Missing on profiles added before Stylebot recorded it.
  createdAt?: Timestamp;
};

/**
 * The gallery listing a profile was installed from or published as. It
 * lives on the profile, so it syncs with it and goes when it does.
 */
export type GalleryListing = {
  styleId: number;
  slug: string;
  version: number;
  // A hash of that version's CSS, to tell if the profile was edited since.
  cssHash: string;
  // Published from here, so publishing it again updates the gallery style,
  // rather than installed from it.
  published: boolean;
};

export type StyleProfiles = {
  [id: string]: StyleProfile;
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  modifiedTime: Timestamp;
  // Whether `!important` is forced onto every declaration. Missing means
  // true; only false is ever stored.
  forceImportant?: boolean;
  // Missing means one unnamed profile holding css.
  profiles?: StyleProfiles;
  activeProfile?: string;
};

export type StyleWithoutUrl = Omit<Style, 'url'>;

export type StyleMap = {
  [url: string]: Omit<Style, 'url'>;
};

/**
 * A style ready to inject: its `@import` urls split out and `!important`
 * already applied, so pages can inject it without parsing any css.
 */
export type CompiledStyle = {
  css: string;
  importUrls: Array<string>;
  enabled: boolean;
  readability: boolean;
};

export type CompiledStyleMap = {
  [url: string]: CompiledStyle;
};

/**
 * Every style compiled, stamped with the styles-metadata revision it was
 * built from and the compiler version, so a stale copy can be told apart.
 */
export type CompiledStyles = {
  version: number;
  revision: string;
  styles: CompiledStyleMap;
};

/**
 * The background's stored styles, handed to sync and history so neither
 * imports the background page.
 */
export type StyleStorage = {
  getAll: () => Promise<StyleMap>;
  /**
   * Replaces every style. fromSync keeps the write from queueing a sync of
   * its own; restoredFrom names the version a restore put back, and entryId
   * the id its history entry takes; skipHistory leaves the write out of the
   * version history.
   */
  setAll: (
    styles: StyleMap,
    options?: {
      fromSync?: boolean;
      restoredFrom?: Timestamp;
      skipHistory?: boolean;
      entryId?: string;
    }
  ) => Promise<void>;
  /**
   * Writes only if nothing landed since `revision` was read, returning the
   * new revision, or null when an edit got in first.
   */
  setAllIfUnchanged: (
    styles: StyleMap,
    revision: string,
    options?: { fromSync?: boolean }
  ) => Promise<string | null>;
  /**
   * Pushes the stored styles to every open tab, which writes don't do on
   * their own.
   */
  applyStylesToAllTabs: () => Promise<void>;
};
