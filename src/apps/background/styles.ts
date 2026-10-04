import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
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
  addProfile,
  activateProfile,
  renameProfile as renameStyleProfile,
  removeProfile,
  expandProfiles,
} from '@stylebot/saved-styles';

import type {
  CompiledStyles,
  StyleMap,
  StyleWithoutUrl,
  ApplyStylesToTab,
  Timestamp,
} from '@stylebot/types';

import { getIsReadabilityActive, updateIcon } from './badge';
import { compileStyles } from './compiled-styles';
import { recordStyleChange } from '@stylebot/history';
import { scheduleSyncAfterEdit } from './sync-scheduler';

export { getStylesForPage } from '@stylebot/saved-styles';

/**
 * Pushes the current styles to every open tab and refreshes the badge
 * for the active one.
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

      if (tab.active) {
        const readabilityActive = await getIsReadabilityActive(tab.id);
        updateIcon(tab, styles, readabilityActive);
      }
    }
  });
};

/**
 * Refreshes the toolbar badge for a single tab based on its styles
 * and readability state.
 */
export const refreshBadgeForTab = async (
  tab: chrome.tabs.Tab
): Promise<void> => {
  if (!tab.url || tab.id === undefined) {
    return;
  }

  const allStyles = await getAll();
  const { styles } = getStylesForPage(tab.url, allStyles);
  const readabilityActive = await getIsReadabilityActive(tab.id);
  updateIcon(tab, styles, readabilityActive);
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
 * Writes the style map, records what it changed, and lines up a sync unless
 * the write came from sync itself. `previous` saves a caller's read.
 */
const writeToStorage = async (
  styles: StyleMap,
  {
    fromSync,
    previous,
    restoredFrom,
  }: { fromSync: boolean; previous?: StoredState; restoredFrom?: Timestamp }
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

  await recordStyleChange(before.styles, styles, { fromSync, restoredFrom });

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
 * Replaces the entire style map. Sync passes fromSync so the write it makes
 * while pulling is not itself queued up as an edit to push. A restore names
 * the version it put back, since that is its own act rather than a
 * continuation of whatever was being edited.
 */
export const setAll = (
  styles: StyleMap,
  {
    fromSync = false,
    restoredFrom,
  }: { fromSync?: boolean; restoredFrom?: Timestamp } = {}
): Promise<void> => {
  pendingWrite = pendingWrite.then(() =>
    writeToStorage(styles, { fromSync, restoredFrom }).then()
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
 * Renames one of a url's profiles. No-op if it does not exist or already
 * has that name.
 */
export const renameProfile = (url: string, profileId: string, name: string) =>
  update(styles => {
    const style =
      styles[url] && renameStyleProfile(styles[url], profileId, name);

    if (!style || style === styles[url]) {
      return undefined;
    }

    styles[url] = editStyle(style, {});
    return styles;
  });

/**
 * Deletes one of a url's profiles, never its last one.
 */
export const deleteProfile = (url: string, profileId: string) =>
  update(styles => {
    const style = styles[url] && removeProfile(styles[url], profileId);

    if (!style || style === styles[url]) {
      return undefined;
    }

    styles[url] = editStyle(style, {});
    return styles;
  });

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
