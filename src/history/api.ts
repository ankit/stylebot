import {
  VersionChange,
  VersionPreview,
  VersionHistory,
  VersionEntry,
  Version,
  StyleMap,
} from '@stylebot/types';

import { diffStyles, getVersionPreview } from './diff';

import {
  getHistory,
  getStylesAtEachVersion,
  getStylesBeforeChange,
} from './store';
import {
  getAll as getAllStyles,
  setAll as setAllStyles,
  applyStylesToAllTabs,
} from '../background/styles';

/**
 * The versions the list shows, what each change did, and what restoring each
 * would do to the styles as they are now.
 *
 * States are rebuilt by walking the stored changes back from the current
 * styles, and the walk stops one past what is shown — that one is what the
 * oldest shown version is described against.
 */
export const scanVersionHistory = async (
  limit?: number
): Promise<VersionHistory> => {
  const [current, entries] = await Promise.all([getAllStyles(), getHistory()]);
  const states = getStylesAtEachVersion(
    current,
    entries,
    limit ? limit + 1 : Infinity
  );

  const shown = limit ? states.slice(0, limit) : states;

  const versions: Array<Version> = shown.map(({ entry }) => ({
    id: entry.id,
    modifiedTime: entry.modifiedTime,
    source: entry.source,
    restoredFrom: entry.restoredFrom,
  }));

  const previews: Record<string, VersionPreview> = {};
  const changes: Record<string, VersionChange> = {};

  shown.forEach(({ entry, styles }, index) => {
    previews[entry.id] = getVersionPreview(current, styles);

    // This state against the one it replaced; the oldest is measured against
    // the state rolling it back once more reaches.
    const before =
      states[index + 1]?.styles ?? getStylesBeforeChange(styles, entry);

    changes[entry.id] = diffStyles(before, styles);
  });

  return { versions, previews, changes, total: entries.length };
};

/**
 * The styles as one version left them, walked back from the styles now — and
 * only that far, rather than rebuilding everything older.
 */
const getStylesForVersion = (
  current: StyleMap,
  entries: Array<VersionEntry>,
  versionId: string
): StyleMap | undefined => {
  let styles = current;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].id === versionId) {
      return styles;
    }

    styles = getStylesBeforeChange(styles, entries[index]);
  }

  return undefined;
};

/**
 * The chosen sites taken from a version, leaving the rest alone — or the
 * version itself, when every site it differs over was chosen.
 */
const applyVersion = (
  current: StyleMap,
  version: StyleMap,
  urls?: Array<string>
): StyleMap => {
  if (!urls) {
    return version;
  }

  const preview = getVersionPreview(current, version);
  const differing = [
    ...preview.addedUrls,
    ...preview.changedUrls,
    ...preview.removedUrls,
  ];

  if (urls.length === differing.length) {
    return version;
  }

  const styles: StyleMap = { ...current };

  urls.forEach(url => {
    if (version[url]) {
      styles[url] = version[url];
    } else {
      delete styles[url];
    }
  });

  return styles;
};

/**
 * Puts a version back, in whole or in part. The write is an ordinary edit,
 * so it is recorded in the history like any other — which is what makes a
 * restore itself undoable.
 */
export const restoreVersion = async (
  versionId: string,
  urls?: Array<string>
): Promise<boolean> => {
  const [current, entries] = await Promise.all([getAllStyles(), getHistory()]);

  const entry = entries.find(({ id }) => id === versionId);
  const version = getStylesForVersion(current, entries, versionId);

  if (!entry || !version) {
    return false;
  }

  await setAllStyles(applyVersion(current, version, urls), {
    restoredFrom: entry.modifiedTime,
  });
  await applyStylesToAllTabs();

  return true;
};
