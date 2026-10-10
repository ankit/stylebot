import { getCurrentTimestamp } from '@stylebot/utils';
import type {
  VersionEntry,
  VersionSource,
  StyleMap,
  Timestamp,
} from '@stylebot/types';

import { expandProfiles, isEquivalentStyle } from '@stylebot/saved-styles';

import { getProfileAction } from './profile-action';

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
 * them — so a restamped time, reformatted css or switching which profile is
 * active is not a change.
 */
const findChangedUrls = (previous: StyleMap, next: StyleMap): Array<string> =>
  [...new Set([...Object.keys(previous), ...Object.keys(next)])].filter(
    url =>
      previous[url] !== next[url] &&
      !isEquivalentStyle(previous[url], next[url], {
        ignoreActiveProfile: true,
      })
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
 * Whether a write only added, deleted or renamed a profile on each style it
 * touched, which the list shows as a step of its own. A switch never gets
 * here, since switching is not a change.
 */
const isProfileChange = (
  previous: StyleMap,
  next: StyleMap,
  urls: Array<string>
): boolean =>
  urls.every(
    url => getProfileAction(previous[url] ?? null, next[url] ?? null) !== null
  );

/**
 * Whether a write made another profile active on any style, which ends the
 * editing session even though the switch itself is not recorded.
 */
const switchesProfile = (previous: StyleMap, next: StyleMap): boolean =>
  Object.keys(next).some(
    url =>
      previous[url] &&
      previous[url] !== next[url] &&
      expandProfiles(previous[url]).active !== expandProfiles(next[url]).active
  );

/**
 * Records what a write changed, as the values it changed away from. A write
 * that changed nothing, or that carries on the session, adds no entry. A
 * restore, or a profile added, deleted or renamed, gets an entry of its own
 * and ends the session, so neither it nor the edits after it are folded in.
 */
export const recordStyleChange = async (
  previous: StyleMap,
  next: StyleMap,
  {
    fromSync,
    restoredFrom,
    entryId,
  }: { fromSync: boolean; restoredFrom?: Timestamp; entryId?: string }
): Promise<void> => {
  const urls = findChangedUrls(previous, next);
  const switched = switchesProfile(previous, next);

  if (urls.length === 0) {
    if (switched) {
      await chrome.storage.local.set({ [SESSION_KEY]: null });
    }
    return;
  }

  const source: VersionSource = fromSync ? 'sync' : 'local';
  const now = Date.now();
  const standalone =
    Boolean(restoredFrom) || switched || isProfileChange(previous, next, urls);

  if (!standalone) {
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
    id: entryId ?? crypto.randomUUID(),
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
    [SESSION_KEY]: standalone ? null : session,
  });
};

/**
 * Takes the newest entry out of the history, if it is still the newest, and
 * ends the session so later edits start an entry of their own. Returns the
 * entry it removed.
 */
export const removeNewestEntry = async (
  id: string
): Promise<VersionEntry | null> => {
  const entries = await getHistory();
  const newest = entries[entries.length - 1];

  if (newest?.id !== id) {
    return null;
  }

  await chrome.storage.local.set({
    [HISTORY_KEY]: entries.slice(0, -1),
    [SESSION_KEY]: null,
  });

  return newest;
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
