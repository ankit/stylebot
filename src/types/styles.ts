import type { Timestamp } from './shared';

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  modifiedTime: Timestamp;
  // Whether `!important` is forced onto every declaration. Missing means
  // true; only false is ever stored.
  forceImportant?: boolean;
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
   * its own; restoredFrom names the version a restore put back.
   */
  setAll: (
    styles: StyleMap,
    options?: { fromSync?: boolean; restoredFrom?: Timestamp }
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
