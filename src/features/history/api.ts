import type {
  RestoreOptions,
  RestoreResult,
  VersionHistory,
  VersionEntry,
  Version,
  StyleMap,
  StyleStorage,
  StyleWithoutUrl,
} from '@stylebot/types';

import {
  collapseProfiles,
  expandProfiles,
  isEquivalentStyleMap,
  listProfiles,
  removeProfile,
  isEquivalentCss,
  isEquivalentStyle,
} from '@stylebot/saved-styles';

import { getProfileAction } from './profile-action';

import { getHistory, getStylesBeforeChange, removeNewestEntry } from './store';

/**
 * The newest versions the list shows, up to `limit` and only those touching
 * `site` when one is given, with the css each change moved and whether each
 * site is still as it left it. States are rebuilt by walking the stored
 * changes back from the current styles. Every site in the history comes too,
 * newest edit first, so the list can offer ones it has not read yet.
 */
export const scanVersionHistory = async (
  storage: StyleStorage,
  { limit = Infinity, site }: { limit?: number; site?: string } = {}
): Promise<VersionHistory> => {
  const [current, entries] = await Promise.all([
    storage.getAll(),
    getHistory(),
  ]);

  const versions: Array<Version> = [];
  const sites = new Map<string, string>();
  let hasMore = false;
  let styles = current;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const after = styles;
    styles = getStylesBeforeChange(styles, entry);

    // Past what is shown, an entry only matters for a site not listed yet.
    const shown = !hasMore && (!site || site in entry.before);
    if (!shown && Object.keys(entry.before).every(url => sites.has(url))) {
      continue;
    }

    const version = toVersion(entry, after, current);
    const urls = Object.keys(version.css);

    // Nothing to show: a profile switch, recorded before switching stopped
    // counting as a change, or a change to a setting rather than css.
    if (!urls.length) {
      continue;
    }

    urls.forEach(url => {
      if (!sites.has(url)) {
        sites.set(url, entry.modifiedTime);
      }
    });

    if (hasMore || (site && !urls.includes(site))) {
      continue;
    }

    if (versions.length === limit) {
      hasMore = true;
      continue;
    }

    versions.push(version);
  }

  return {
    versions,
    hasMore,
    sites: [...sites].map(([url, modifiedTime]) => ({ url, modifiedTime })),
  };
};

/**
 * One profile's css in a style, or null where the style or profile is absent.
 */
const sheetCss = (
  style: StyleWithoutUrl | null | undefined,
  id: string
): string | null => {
  const sheet = style ? expandProfiles(style).sheets[id] : undefined;
  return sheet ? sheet.css : null;
};

/**
 * The profile an edit changed the css of. Switching profiles is not
 * recorded, so the one active after it may not be the one edited; the
 * active one stands in when no single profile changed.
 */
const findEditedProfile = (
  before: StyleWithoutUrl | null,
  after: StyleWithoutUrl
): string => {
  const { active, sheets } = expandProfiles(after);
  const old = before ? expandProfiles(before).sheets : {};
  const edited = Object.keys(sheets).filter(
    id => !old[id] || !isEquivalentCss(old[id].css, sheets[id].css)
  );

  return edited.length === 1 ? edited[0] : active;
};

/**
 * Whether two copies of a stylesheet match, absent counting as its own value.
 */
const isSameCss = (a: string | null, b: string | null): boolean =>
  a === null || b === null ? a === b : isEquivalentCss(a, b);

/**
 * One version as the list shows it: for each site it touched, the css of the
 * profile the change was made in, before and after, and whether that profile
 * — or the site, once deleted — is still as the change left it. Sites whose
 * css it left as it was are left out.
 */
const toVersion = (
  entry: VersionEntry,
  after: StyleMap,
  current: StyleMap
): Version => {
  const css: Version['css'] = {};

  Object.entries(entry.before).forEach(([url, before]) => {
    const style = after[url];
    const action = getProfileAction(before, style ?? null);

    if (action?.kind === 'switched') {
      return;
    }

    // A deleted site has no profile; otherwise read the one changed.
    let profile: { id: string; name: string } | undefined;
    if (action && 'id' in action) {
      profile = { id: action.id, name: action.name };
    } else if (style) {
      const id = findEditedProfile(before ?? null, style);
      profile = { id, name: expandProfiles(style).sheets[id].name };
    }

    const old = profile ? sheetCss(before, profile.id) : before?.css ?? null;
    const now = profile ? sheetCss(style, profile.id) : null;

    if (!action && isSameCss(old, now)) {
      return;
    }

    css[url] = {
      before: old,
      after: now,
      ...(profile ? { profile } : {}),
      ...(action ? { profileAction: action } : {}),
      matchesNow: profile
        ? isSameCss(sheetCss(current[url], profile.id), now)
        : isEquivalentStyle(style, current[url]),
    };
  });

  return {
    id: entry.id,
    modifiedTime: entry.modifiedTime,
    source: entry.source,
    restoredFrom: entry.restoredFrom,
    css,
  };
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
 * The chosen sites taken from a version, leaving the rest alone, or the
 * whole version without any chosen.
 */
const applyVersion = (
  current: StyleMap,
  version: StyleMap,
  urls?: Array<string>
): StyleMap => {
  if (!urls) {
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
 * One profile of a site taken from a version, leaving the site's other
 * profiles, and which is active, as they are now. A profile deleted since
 * comes back under its old name, one the version did not have yet is
 * removed, and a site deleted since comes back whole.
 */
const applyProfile = (
  current: StyleMap,
  version: StyleMap,
  url: string,
  profileId: string
): StyleMap => {
  const now = current[url];
  const then = version[url] && expandProfiles(version[url]).sheets[profileId];

  if (!then) {
    return now ? { ...current, [url]: removeProfile(now, profileId) } : current;
  }

  // A site with one profile then and now is the profile, so it is put back
  // whole rather than given a profile structure it never had.
  const expanded = now && expandProfiles(now);
  const hasOne = (style: StyleWithoutUrl) => listProfiles(style).length < 2;

  if (!now || !expanded || (hasOne(now) && hasOne(version[url]))) {
    return { ...current, [url]: version[url] };
  }

  const sheet = expanded.sheets[profileId];

  return {
    ...current,
    [url]: collapseProfiles(now, {
      active: expanded.active,
      sheets: {
        ...expanded.sheets,
        [profileId]: { name: sheet?.name ?? then.name, css: then.css },
      },
    }),
  };
};

/**
 * The newest change before an entry that touched any of `urls`, or any change
 * at all without them: the version that putting back the styles from just
 * before the entry returns those sites to.
 */
const findEarlierChange = (
  entries: Array<VersionEntry>,
  index: number,
  urls?: Array<string>
): VersionEntry | undefined => {
  for (let earlier = index - 1; earlier >= 0; earlier -= 1) {
    if (!urls || urls.some(url => url in entries[earlier].before)) {
      return entries[earlier];
    }
  }

  return undefined;
};

/**
 * Puts a version back, in whole or in part. The write is recorded like any
 * other edit, and the entry it recorded is returned so it can be undone;
 * a restore that changed nothing records none.
 */
export const restoreVersion = async (
  storage: StyleStorage,
  versionId: string,
  { urls, before = false, profileId }: RestoreOptions = {}
): Promise<RestoreResult> => {
  const [current, entries] = await Promise.all([
    storage.getAll(),
    getHistory(),
  ]);

  const index = entries.findIndex(({ id }) => id === versionId);
  const entry = entries[index];
  const styles = getStylesForVersion(current, entries, versionId);

  if (!entry || !styles) {
    return { ok: false };
  }

  const version = before ? getStylesBeforeChange(styles, entry) : styles;
  const restoredFrom = before
    ? findEarlierChange(entries, index, urls)?.modifiedTime ??
      entry.modifiedTime
    : entry.modifiedTime;

  const restored =
    profileId && urls?.length === 1
      ? applyProfile(current, version, urls[0], profileId)
      : applyVersion(current, version, urls);

  if (isEquivalentStyleMap(current, restored)) {
    return { ok: true };
  }

  // Named up front, so Undo can only ever take back this restore's entry.
  const entryId = crypto.randomUUID();

  await storage.setAll(restored, { restoredFrom, entryId });
  await storage.applyStylesToAllTabs();

  return { ok: true, entryId };
};

/**
 * Takes back a restore. While it is still the newest change, the styles go
 * back to how they were before it and its entry leaves the history, as if it
 * had not happened; once something has changed since, the sites it touched
 * are restored to just before it, which is recorded like any restore.
 */
export const undoRestore = async (
  storage: StyleStorage,
  entryId: string,
  profileId?: string
): Promise<boolean> => {
  const [current, entries] = await Promise.all([
    storage.getAll(),
    getHistory(),
  ]);
  const entry = entries.find(({ id }) => id === entryId);

  if (!entry) {
    return false;
  }

  const removed =
    entries[entries.length - 1] === entry && (await removeNewestEntry(entryId));

  if (!removed) {
    const result = await restoreVersion(storage, entryId, {
      urls: Object.keys(entry.before),
      before: true,
      profileId,
    });
    return result.ok;
  }

  await storage.setAll(getStylesBeforeChange(current, removed), {
    skipHistory: true,
  });
  await storage.applyStylesToAllTabs();

  return true;
};
