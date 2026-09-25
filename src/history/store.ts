import { getCurrentTimestamp } from '@stylebot/utils';
import type {
  VersionEntry,
  VersionSource,
  StyleMap,
  Timestamp,
} from '@stylebot/types';

import { isEquivalentStyle } from '@stylebot/styles';

const HISTORY_KEY = 'version-history';
const SESSION_KEY = 'version-history-session';

/**
 * A pause this long ends the editing session, so the writes that follow start
 * a new entry. The code editor saves every time typing pauses, so without a
 * session a few minutes of editing would be a list of near-identical entries.
 */
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * What the whole history may take up. Entries hold css, so a count alone
 * bounds nothing: one entry can be a large stylesheet.
 */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * The editing session the newest entry is still collecting writes for. Kept
 * beside the history, so every write weighs itself against a few bytes rather
 * than against every entry.
 */
type EditSession = {
  startedAt: number;
  source: VersionSource;
  urls: Array<string>;
};

/**
 * The urls whose style the write changed, compared the way sync compares
 * them — so a restamped time or reformatted css is not a change.
 */
const findChangedUrls = (previous: StyleMap, next: StyleMap): Array<string> =>
  [...new Set([...Object.keys(previous), ...Object.keys(next)])].filter(
    url =>
      previous[url] !== next[url] &&
      !isEquivalentStyle(previous[url], next[url])
  );

/**
 * Whether this write belongs to the session already under way: the same
 * styles, from the same place, before the session has timed out.
 */
const belongsToSession = (
  session: EditSession | undefined,
  urls: Array<string>,
  source: VersionSource,
  now: number
): boolean =>
  Boolean(
    session?.source === source &&
      now - session.startedAt <= SESSION_TIMEOUT_MS &&
      urls.every(url => session.urls.includes(url))
  );

/**
 * The newest entries that fit the budget. Each is measured once and the
 * oldest go in one cut.
 */
const trimToBudget = (entries: Array<VersionEntry>): Array<VersionEntry> => {
  const sizes = entries.map(entry => JSON.stringify(entry).length);
  let total = sizes.reduce((sum, size) => sum + size, 0);
  let from = 0;

  while (from < entries.length - 1 && total > MAX_BYTES) {
    total -= sizes[from];
    from += 1;
  }

  return from === 0 ? entries : entries.slice(from);
};

/**
 * Every change recorded, oldest first.
 */
export const getHistory = async (): Promise<Array<VersionEntry>> => {
  const items = await chrome.storage.local.get(HISTORY_KEY);
  return items[HISTORY_KEY] || [];
};

/**
 * Records what a write changed, as the values it changed away from. A write
 * that changed nothing, or that carries on the session, adds no entry. A
 * restore names the version it put back, which gives it an entry of its own
 * and ends the session, so neither it nor the edits after it are folded in.
 */
export const recordStyleChange = async (
  previous: StyleMap,
  next: StyleMap,
  { fromSync, restoredFrom }: { fromSync: boolean; restoredFrom?: Timestamp }
): Promise<void> => {
  const urls = findChangedUrls(previous, next);

  if (urls.length === 0) {
    return;
  }

  const source: VersionSource = fromSync ? 'sync' : 'local';
  const now = Date.now();

  if (!restoredFrom) {
    const items = await chrome.storage.local.get(SESSION_KEY);

    if (belongsToSession(items[SESSION_KEY], urls, source, now)) {
      return;
    }
  }

  const before: VersionEntry['before'] = {};
  urls.forEach(url => {
    before[url] = previous[url] ?? null;
  });

  const entry: VersionEntry = {
    id: crypto.randomUUID(),
    modifiedTime: getCurrentTimestamp(),
    source,
    before,
    ...(restoredFrom ? { restoredFrom } : {}),
  };

  const entries = await getHistory();
  entries.push(entry);

  const session: EditSession = { startedAt: now, source, urls };

  await chrome.storage.local.set({
    [HISTORY_KEY]: trimToBudget(entries),
    ...(restoredFrom ? {} : { [SESSION_KEY]: session }),
  });

  if (restoredFrom) {
    await chrome.storage.local.remove(SESSION_KEY);
  }
};

/**
 * The styles as they were before an entry's change, which is the entry
 * applied backwards.
 */
export const getStylesBeforeChange = (
  styles: StyleMap,
  entry: VersionEntry
): StyleMap => {
  const older = { ...styles };

  Object.entries(entry.before).forEach(([url, style]) => {
    if (style) {
      older[url] = style;
    } else {
      delete older[url];
    }
  });

  return older;
};

/**
 * The styles as of each version, newest first: a version's styles are the
 * live map with every change since it undone. Stops after `limit` versions.
 */
export const getStylesAtEachVersion = (
  current: StyleMap,
  entries: Array<VersionEntry>,
  limit = Infinity
): Array<{ entry: VersionEntry; styles: StyleMap }> => {
  const versions: Array<{ entry: VersionEntry; styles: StyleMap }> = [];
  let styles = current;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (versions.length === limit) {
      break;
    }

    const entry = entries[index];
    versions.push({ entry, styles });
    styles = getStylesBeforeChange(styles, entry);
  }

  return versions;
};
