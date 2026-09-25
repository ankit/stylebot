import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
import { getStylesForPage } from '@stylebot/styles';

import {
  StyleMap,
  StyleWithoutUrl,
  ApplyStylesToTab,
  Timestamp,
} from '@stylebot/types';

import { getIsReadabilityActive, updateIcon } from './badge';
import { recordStyleChange } from '../history/store';
import { scheduleSyncAfterEdit } from './sync-scheduler';

export { getStylesForPage } from '@stylebot/styles';

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
  const items = await chrome.storage.local.get('styles');
  return items['styles'] || {};
};

/**
 * Reads the stored style for a single url.
 */
export const get = async (url: string): Promise<StyleWithoutUrl> => {
  const styles = await getAll();
  return styles[url];
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
  }: { fromSync: boolean; previous?: StyleMap; restoredFrom?: Timestamp }
): Promise<string> => {
  const modifiedTime = getCurrentTimestamp();
  const before = previous ?? (await getAll());

  await chrome.storage.local.set({
    styles,
    'styles-metadata': { modifiedTime },
  });

  await recordStyleChange(before, styles, { fromSync, restoredFrom });

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
    const items = await chrome.storage.local.get(['styles', 'styles-metadata']);

    if (items['styles-metadata']?.modifiedTime !== revision) {
      return null;
    }

    return writeToStorage(styles, {
      fromSync,
      previous: items['styles'] || {},
    });
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
    const previous = await getAll();
    const styles = mutate({ ...previous });

    if (styles) {
      await writeToStorage(styles, { fromSync: false, previous });
    }
  });

  return pendingWrite;
};

/**
 * Saves the style for a url, or removes it if css is empty. An undefined
 * forceImportant keeps the stored style's current value.
 */
export const set = (
  url: string,
  css: string,
  readability: boolean,
  forceImportant?: boolean
): Promise<void> =>
  update(styles => {
    if (!css) {
      delete styles[url];
    } else {
      const keepForceImportant =
        forceImportant ?? styles[url]?.forceImportant !== false;

      styles[url] = {
        css,
        readability,
        enabled: true,
        modifiedTime: getCurrentTimestamp(),
        ...(keepForceImportant ? {} : { forceImportant: false }),
      };
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
 * Checks whether a Google Web Fonts stylesheet url resolves to a real font.
 */
export const getGoogleWebFontExists = (url: string): Promise<boolean> => {
  return fetch(url)
    .then(response => response.status !== 400)
    .catch(() => false);
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
