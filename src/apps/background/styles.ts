import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
import { hashCss } from '@stylebot/gallery';
import {
  COMPILED_STYLES_KEY,
  STYLES_KEY,
  STYLES_METADATA_KEY,
  getStylesForPage,
  isCompiledStylesCurrent,
  isForceImportant,
  withForceImportant,
  hasAnyCss,
  listProfiles,
  setProfileCss,
  setProfileGalleryListing,
  removeGalleryListings,
  addProfile,
  activateProfile,
  renameProfile as renameStyleProfile,
  removeProfile,
  expandProfiles,
  getProfileSheet,
  freeProfileName,
  DEFAULT_PROFILE_ID,
} from '@stylebot/saved-styles';

import type {
  CompiledStyles,
  GalleryListing,
  StyleMap,
  StyleWithoutUrl,
  ApplyStylesToTab,
  Timestamp,
} from '@stylebot/types';

import { compileStyles } from './compiled-styles';
import { recordStyleChange } from '@stylebot/history';
import { scheduleSyncAfterEdit } from './sync-scheduler';

export { getStylesForPage } from '@stylebot/saved-styles';

/**
 * Pushes the current styles to every open tab.
 */
export const applyStylesToAllTabs = async (): Promise<void> => {
  const allStyles = await getAll();
  const tabs = await chrome.tabs.query({});

  tabs.forEach(async tab => {
    if (tab?.url && tab.id) {
      const { styles, defaultStyle } = getStylesForPage(tab.url, allStyles);

      const message: ApplyStylesToTab = {
        name: 'ApplyStylesToTab',
        defaultStyle,
        styles,
      };

      chrome.tabs.sendMessage(tab.id, message);
    }
  });
};

/**
 * Reads the full style map from storage, defaulting to an empty map.
 */
export const getAll = async (): Promise<StyleMap> => {
  const items = await chrome.storage.local.get(STYLES_KEY);
  return items[STYLES_KEY] || {};
};

/**
 * Reads the stored style for a single url.
 */
export const get = async (url: string): Promise<StyleWithoutUrl> => {
  const styles = await getAll();
  return styles[url];
};

type StoredState = {
  styles: StyleMap;
  revision?: string;
  compiled?: CompiledStyles;
};

/**
 * Everything a write needs from storage, in one read: the styles it replaces,
 * their revision, and the compiled copy it can reuse entries from.
 */
const readForWrite = async (): Promise<StoredState> => {
  const items = await chrome.storage.local.get([
    STYLES_KEY,
    STYLES_METADATA_KEY,
    COMPILED_STYLES_KEY,
  ]);

  return {
    styles: items[STYLES_KEY] || {},
    revision: items[STYLES_METADATA_KEY]?.modifiedTime,
    compiled: items[COMPILED_STYLES_KEY],
  };
};

/**
 * Writes the style map, records what it changed unless told not to, and
 * lines up a sync unless the write came from sync itself. `previous` saves a
 * caller's read.
 */
const writeToStorage = async (
  styles: StyleMap,
  {
    fromSync,
    previous,
    restoredFrom,
    skipHistory = false,
    entryId,
  }: {
    fromSync: boolean;
    previous?: StoredState;
    restoredFrom?: Timestamp;
    skipHistory?: boolean;
    entryId?: string;
  }
): Promise<string> => {
  const modifiedTime = getCurrentTimestamp();
  const before = previous ?? (await readForWrite());
  const reuse =
    before.compiled &&
    isCompiledStylesCurrent(before.compiled, before.revision ?? '')
      ? { styles: before.styles, compiled: before.compiled.styles }
      : undefined;

  await chrome.storage.local.set({
    [STYLES_KEY]: styles,
    [STYLES_METADATA_KEY]: { modifiedTime },
    [COMPILED_STYLES_KEY]: compileStyles(styles, modifiedTime, reuse),
  });

  if (!skipHistory) {
    await recordStyleChange(before.styles, styles, {
      fromSync,
      restoredFrom,
      entryId,
    });
  }

  if (!fromSync) {
    await scheduleSyncAfterEdit();
  }

  return modifiedTime;
};

/**
 * Chains writes so each mutation reads styles only after the prior write
 * finished, preventing concurrent writes (e.g. rapid keystrokes in the code
 * editor) from clobbering each other.
 */
let pendingWrite = Promise.resolve();

/**
 * Queues every later write behind `ready`, so none reads styles before it
 * resolves. `ready` must never reject, and must not write through this chain
 * itself, or it would wait on its own write.
 */
export const holdWritesUntil = (ready: Promise<void>): void => {
  pendingWrite = pendingWrite.then(() => ready);
};

/**
 * Replaces the entire style map. Sync passes fromSync so the write it makes
 * while pulling is not itself queued up as an edit to push. A restore names
 * the version it put back, since that is its own act rather than a
 * continuation of whatever was being edited; undoing one skips the history,
 * which drops the restore's entry instead.
 */
export const setAll = (
  styles: StyleMap,
  {
    fromSync = false,
    restoredFrom,
    skipHistory = false,
    entryId,
  }: {
    fromSync?: boolean;
    restoredFrom?: Timestamp;
    skipHistory?: boolean;
    entryId?: string;
  } = {}
): Promise<void> => {
  pendingWrite = pendingWrite.then(() =>
    writeToStorage(styles, {
      fromSync,
      restoredFrom,
      skipHistory,
      entryId,
    }).then()
  );
  return pendingWrite;
};

/**
 * Replaces the style map only if no write has landed since `revision` was
 * read, and returns the revision stamped — or null when an edit got in
 * first. The check runs inside the write chain, so nothing can slip in
 * between it and the write. Sync uses this so a merge computed from a
 * snapshot never overwrites an edit made while it was computing.
 */
export const setAllIfUnchanged = (
  styles: StyleMap,
  revision: string,
  { fromSync = false }: { fromSync?: boolean } = {}
): Promise<string | null> => {
  const attempt = pendingWrite.then(async () => {
    const previous = await readForWrite();

    if (previous.revision !== revision) {
      return null;
    }

    return writeToStorage(styles, { fromSync, previous });
  });

  pendingWrite = attempt.then(() => undefined);
  return attempt;
};

/**
 * Returns the stored compiled styles, rebuilding them first when they're
 * missing, from an older compiler, or built from other styles than the ones
 * stored now. Runs in the write chain, so no write lands halfway through.
 */
export const ensureCompiledStyles = (): Promise<CompiledStyles> => {
  const attempt = pendingWrite.then(async () => {
    const items = await chrome.storage.local.get([
      STYLES_KEY,
      STYLES_METADATA_KEY,
      COMPILED_STYLES_KEY,
    ]);
    const revision: string = items[STYLES_METADATA_KEY]?.modifiedTime ?? '';
    const stored: CompiledStyles | undefined = items[COMPILED_STYLES_KEY];

    if (stored && isCompiledStylesCurrent(stored, revision)) {
      return stored;
    }

    const compiled = compileStyles(items[STYLES_KEY] || {}, revision);
    await chrome.storage.local.set({ [COMPILED_STYLES_KEY]: compiled });
    return compiled;
  });

  pendingWrite = attempt.then(() => undefined);
  return attempt;
};

/**
 * A style with fields changed and the time stamped as edited now. A new
 * object, so the map the write was computed from is left as it was.
 */
const editStyle = (
  style: StyleWithoutUrl,
  changes: Partial<StyleWithoutUrl>
): StyleWithoutUrl => ({
  ...style,
  ...changes,
  modifiedTime: getCurrentTimestamp(),
});

/**
 * Runs a read-mutate-write against the style map through the pendingWrite
 * chain. `mutate` returns the updated map, or undefined to skip the write.
 */
const update = (
  mutate: (styles: StyleMap) => StyleMap | undefined
): Promise<void> => {
  pendingWrite = pendingWrite.then(async () => {
    const previous = await readForWrite();
    const styles = mutate({ ...previous.styles });

    if (styles) {
      await writeToStorage(styles, { fromSync: false, previous });
    }
  });

  return pendingWrite;
};

/**
 * Applies a change to a url's style, skipping the write when it has none or
 * the change returns it as it is.
 */
const updateStyle = (
  url: string,
  change: (style: StyleWithoutUrl) => StyleWithoutUrl
) =>
  update(styles => {
    const style = styles[url] && change(styles[url]);

    if (!style || style === styles[url]) {
      return undefined;
    }

    styles[url] = editStyle(style, {});
    return styles;
  });

/**
 * Saves a profile's css for a url, the active one unless profileId names
 * another, and removes the style once no profile has css left. Skips the
 * write when profileId no longer exists. An undefined forceImportant keeps
 * the stored style's current value.
 */
export const set = (
  url: string,
  css: string,
  readability: boolean,
  forceImportant?: boolean,
  profileId?: string
): Promise<void> =>
  update(styles => {
    const existing = styles[url] ?? {
      css: '',
      readability,
      enabled: true,
      modifiedTime: getCurrentTimestamp(),
    };
    const id =
      profileId ?? listProfiles(existing).find(profile => profile.active)?.id;

    if (!listProfiles(existing).some(profile => profile.id === id)) {
      return undefined;
    }

    const style = withForceImportant(
      {
        ...setProfileCss(existing, id as string, css),
        readability,
        enabled: true,
        modifiedTime: getCurrentTimestamp(),
      },
      forceImportant ?? isForceImportant(styles[url])
    );

    if (hasAnyCss(style)) {
      styles[url] = style;
    } else {
      delete styles[url];
    }

    return styles;
  });

/**
 * Enables an existing style for a url. No-op if none exists or it is
 * already enabled.
 */
export const enable = (url: string): Promise<void> =>
  update(styles => {
    if (!styles[url] || styles[url].enabled) {
      return undefined;
    }

    styles[url] = editStyle(styles[url], { enabled: true });
    return styles;
  });

/**
 * Disables an existing style for a url. No-op if none exists or it is
 * already disabled.
 */
export const disable = (url: string): Promise<void> =>
  update(styles => {
    if (!styles[url]?.enabled) {
      return undefined;
    }

    styles[url] = editStyle(styles[url], { enabled: false });
    return styles;
  });

/**
 * Flips the enabled state of a page's default style, deciding from the map
 * the write reads so presses in quick succession each flip it once.
 */
export const toggleForPage = (pageUrl: string): Promise<void> =>
  update(styles => {
    const { defaultStyle } = getStylesForPage(pageUrl, styles);

    if (!defaultStyle) {
      return undefined;
    }

    styles[defaultStyle.url] = editStyle(styles[defaultStyle.url], {
      enabled: !defaultStyle.enabled,
    });
    return styles;
  });

/**
 * Sets readability for a url, creating a blank style entry if none exists.
 * Skips the write when nothing would change: every ApplyStylesToTab makes the
 * editor re-persist readability, and a no-op write would still bump
 * styles-metadata and read as a local edit to sync.
 */
export const setReadability = (url: string, value: boolean): Promise<void> =>
  update(styles => {
    if (styles[url]) {
      if (styles[url].readability === value) {
        return undefined;
      }

      styles[url] = editStyle(styles[url], { readability: value });
    } else {
      if (!value) {
        return undefined;
      }

      styles[url] = {
        css: '',
        enabled: true,
        readability: value,
        modifiedTime: getCurrentTimestamp(),
      };
    }

    return styles;
  });

/**
 * Renames a style's url, moving its entry from src to dest.
 */
export const move = (src: string, dest: string): Promise<void> =>
  update(styles => {
    if (!styles[src]) {
      return undefined;
    }

    styles[dest] = editStyle(styles[src], {});
    delete styles[src];

    return styles;
  });

/**
 * Makes a profile the one applied for a url. No-op if the style or the
 * profile does not exist, or it is already active. Not stamped as an edit:
 * which profile is applied is this device's choice, and sync keeps it local.
 */
export const setActiveProfile = (url: string, profileId: string) =>
  update(styles => {
    const style = styles[url] && activateProfile(styles[url], profileId);

    if (!style || style === styles[url]) {
      return undefined;
    }

    styles[url] = style;
    return styles;
  });

/**
 * Adds a profile to a url's style, blank or a copy of sourceProfileId, and
 * returns its id. Creates the style when the url has none yet.
 */
export const createProfile = async (
  url: string,
  {
    name,
    sourceProfileId,
    activate,
  }: { name: string; sourceProfileId?: string; activate: boolean }
): Promise<string> => {
  const id = crypto.randomUUID();

  await update(styles => {
    const existing = styles[url] ?? {
      css: '',
      readability: false,
      enabled: true,
      modifiedTime: getCurrentTimestamp(),
    };
    const source = sourceProfileId
      ? expandProfiles(existing).sheets[sourceProfileId]
      : undefined;

    styles[url] = editStyle(
      addProfile(existing, { id, name, css: source?.css ?? '', activate }),
      {}
    );
    return styles;
  });

  return id;
};

/**
 * Adds css as a new, active profile of a url's style and turns the style on.
 * Without a gallery listing, the same name and css switch back to that
 * profile; with one, it replaces an empty default profile.
 */
export const installProfile = async (
  url: string,
  {
    name,
    css,
    galleryListing,
  }: { name: string; css: string; galleryListing?: GalleryListing }
): Promise<{ name: string; id: string }> => {
  let installedName = name;
  let installedId = '';

  await update(styles => {
    const existing = styles[url] ?? {
      css: '',
      readability: false,
      enabled: true,
      modifiedTime: getCurrentTimestamp(),
    };

    const profiles = listProfiles(existing);
    const { sheets } = expandProfiles(existing);
    const isSameInstall = (profile: { id: string; name: string }) =>
      profile.name === name && sheets[profile.id].css === css;
    // A gallery install gets its own profile, never one that only looks the same.
    const installed = galleryListing ? undefined : profiles.find(isSameInstall);

    if (installed) {
      installedId = installed.id;
      const style = activateProfile(existing, installed.id);

      if (style === existing && existing.enabled) {
        return undefined;
      }

      styles[url] = { ...style, enabled: true };
      return styles;
    }

    installedName = freeProfileName(
      name,
      profiles.map(profile => profile.name)
    );
    installedId = crypto.randomUUID();

    const added = addProfile(existing, {
      id: installedId,
      name: installedName,
      css,
      galleryListing,
      activate: true,
    });
    const defaultSheet = sheets[DEFAULT_PROFILE_ID];
    const replacesDefault =
      galleryListing &&
      defaultSheet &&
      !defaultSheet.css.trim() &&
      !defaultSheet.galleryListing;

    styles[url] = editStyle(
      replacesDefault ? removeProfile(added, DEFAULT_PROFILE_ID) : added,
      { enabled: true }
    );

    return styles;
  });

  return { name: installedName, id: installedId };
};

/**
 * Switches a url's style back to a profile installed before, replacing its
 * css and gallery listing when given, and turns the style on. Resolves with the
 * profile's name, or null when the profile is gone.
 */
export const reinstallProfile = async (
  url: string,
  profileId: string,
  {
    css,
    galleryListing,
  }: { css?: string; galleryListing?: GalleryListing } = {}
): Promise<string | null> => {
  let name: string | null = null;

  await update(styles => {
    const existing = styles[url];
    const sheet = getProfileSheet(existing, profileId);

    if (!existing || !sheet) {
      return undefined;
    }

    name = sheet.name;

    let style = activateProfile(existing, profileId);

    if (css !== undefined) {
      style = setProfileCss(style, profileId, css);
    }

    if (galleryListing) {
      style = setProfileGalleryListing(style, profileId, galleryListing);
    }

    if (style === existing && existing.enabled) {
      return undefined;
    }

    styles[url] = editStyle(style, { enabled: true });
    return styles;
  });

  return name;
};

/**
 * Updates an installed profile to a newer version of its gallery style,
 * leaving which profile is active and whether the style is on as they are.
 * Skips a profile edited since it was installed, or already at that version.
 */
export const updateGalleryProfile = (
  url: string,
  profileId: string,
  css: string,
  galleryListing: GalleryListing
) =>
  updateStyle(url, style => {
    const sheet = getProfileSheet(style, profileId);
    const current = sheet?.galleryListing;
    const isOutdated =
      current?.styleId === galleryListing.styleId &&
      current.version < galleryListing.version &&
      hashCss(sheet?.css ?? '') === current.cssHash;

    if (!isOutdated) {
      return style;
    }

    const updated = setProfileCss(style, profileId, css);
    return setProfileGalleryListing(updated, profileId, galleryListing);
  });

/**
 * Sets the gallery listing of one of a url's profiles.
 */
export const setGalleryListing = (
  url: string,
  profileId: string,
  galleryListing: GalleryListing
) =>
  updateStyle(url, style =>
    setProfileGalleryListing(style, profileId, galleryListing)
  );

/**
 * Puts a gallery style's css back in one of a url's profiles, dropping the
 * user's edits, with the listing of the version it came from.
 */
export const resetGalleryProfile = (
  url: string,
  profileId: string,
  css: string,
  galleryListing: GalleryListing
) =>
  updateStyle(url, style => {
    const updated = setProfileCss(style, profileId, css);
    return setProfileGalleryListing(updated, profileId, galleryListing);
  });

/**
 * Puts urls' styles back as they were, removing those that had none.
 */
export const restoreStyles = (
  previous: Record<string, StyleWithoutUrl | null>
): Promise<void> =>
  update(styles => {
    for (const [url, style] of Object.entries(previous)) {
      if (style) {
        styles[url] = editStyle(style, {});
      } else {
        delete styles[url];
      }
    }

    return styles;
  });

/**
 * Drops a gallery style's listing from every profile, once it's unpublished.
 */
export const removeStyleGalleryListings = (styleId: number) =>
  update(styles => {
    const isUnpublished = (galleryListing: GalleryListing) =>
      galleryListing.styleId === styleId;
    let changed = false;

    for (const [url, style] of Object.entries(styles)) {
      const updated = removeGalleryListings(style, isUnpublished);

      if (updated !== style) {
        styles[url] = editStyle(updated, {});
        changed = true;
      }
    }

    return changed ? styles : undefined;
  });

/**
 * Renames one of a url's profiles. No-op if it does not exist or already
 * has that name.
 */
export const renameProfile = (url: string, profileId: string, name: string) =>
  updateStyle(url, style => renameStyleProfile(style, profileId, name));

/**
 * Deletes a url's style, with all its profiles.
 */
export const deleteStyle = (url: string) =>
  update(styles => {
    if (!styles[url]) {
      return undefined;
    }

    delete styles[url];
    return styles;
  });

/**
 * Deletes one of a url's profiles, never its last one.
 */
export const deleteProfile = (url: string, profileId: string) =>
  updateStyle(url, style => removeProfile(style, profileId));

/**
 * Checks whether a Google Web Fonts stylesheet url resolves to a real font.
 */
export const getGoogleWebFontExists = (url: string): Promise<boolean> => {
  return fetch(url)
    .then(response => response.status !== 400)
    .catch(() => false);
};

const GOOGLE_FONT_FILE = /^https:\/\/fonts\.gstatic\.com\//;

/**
 * Fetches a Google Fonts file as base64, for a page whose CSP blocks loading
 * it. Any other url, or a failed request, resolves to an empty string.
 */
export const getGoogleFontFile = async (url: string): Promise<string> => {
  if (!GOOGLE_FONT_FILE.test(url)) {
    return '';
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return '';
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';

    // Chunked, since spreading a whole font into one call overflows the stack.
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return btoa(binary);
  } catch {
    return '';
  }
};

/**
 * Fetches CSS from a url for import, resolving to an empty string on
 * failure or invalid CSS.
 */
export const getImportCss = (url: string): Promise<string> => {
  return new Promise(resolve => {
    fetch(url)
      .then(response => response.text())
      .then(css => {
        postcss.parse(css);
        resolve(css);
      })
      .catch(() => {
        // if css is invalid, return back empty css
        resolve('');
      });
  });
};
