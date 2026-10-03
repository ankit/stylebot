import type { StyleMap, StyleWithoutUrl } from '@stylebot/types';
import {
  collapseProfiles,
  expandProfiles,
  isEquivalentCss,
  isEquivalentStyle,
} from '@stylebot/saved-styles';
import type { ExpandedProfiles, ProfileSheet } from '@stylebot/saved-styles';

import { mergeCss } from './merge-css';
import { mergeWithoutBase } from './merge-without-base';

export type StyleMergeResult = {
  styles: StyleMap;
  // Urls whose css had lines parked in a conflict comment.
  conflicts: Array<string>;
};

const parseTime = (timestamp?: string) => {
  const time = new Date(timestamp ?? '').getTime();
  return Number.isNaN(time) ? 0 : time;
};

const isSameSheet = (a?: ProfileSheet, b?: ProfileSheet) =>
  !a || !b ? !a && !b : a.name === b.name && isEquivalentCss(a.css, b.css);

/**
 * The name a profile ends up with when both sides changed it: a rename made
 * on one side only, or the newer rename when both renamed it.
 */
const mergeName = (
  base: ProfileSheet | undefined,
  local: ProfileSheet,
  remote: ProfileSheet,
  localWins: boolean
) => {
  if (local.name === remote.name || remote.name === base?.name) {
    return local.name;
  }

  if (local.name === base?.name) {
    return remote.name;
  }

  return localWins ? local.name : remote.name;
};

/**
 * Both sides changed the same style: flags and which profile is active
 * follow the newer edit, and each profile merges like a style does, its css
 * hunk by hunk against the base with the newer edit winning any hunk both
 * sides rewrote. A profile is only deleted when the side that deleted it
 * holds the newer copy of the style.
 */
const mergeStyle = (
  base: StyleWithoutUrl | undefined,
  local: StyleWithoutUrl,
  remote: StyleWithoutUrl,
  at: string
): { style: StyleWithoutUrl; conflicted: boolean } => {
  const localWins =
    parseTime(local.modifiedTime) >= parseTime(remote.modifiedTime);
  const newer = localWins ? local : remote;

  const b = base ? expandProfiles(base).sheets : {};
  const l = expandProfiles(local);
  const r = expandProfiles(remote);
  const ids = new Set([
    ...Object.keys(l.sheets),
    ...Object.keys(r.sheets),
    ...Object.keys(b),
  ]);

  const sheets: ExpandedProfiles['sheets'] = {};
  let conflicted = false;

  ids.forEach(id => {
    const bs = b[id];
    const ls = l.sheets[id];
    const rs = r.sheets[id];
    const localChanged = !isSameSheet(bs, ls);
    const remoteChanged = !isSameSheet(bs, rs);

    let sheet: ProfileSheet | undefined;

    // A deletion only carries when it is the newer edit of the style: an
    // older copy missing a profile is more likely stale than deliberate.
    if (!remoteChanged) {
      sheet = ls ?? (localWins ? undefined : rs);
    } else if (!localChanged) {
      sheet = rs ?? (localWins ? ls : undefined);
    } else if (!ls || !rs || isSameSheet(ls, rs)) {
      sheet = ls ?? rs;
    } else {
      const merged = mergeCss(bs?.css ?? '', ls.css, rs.css, localWins, at);

      sheet = { name: mergeName(bs, ls, rs, localWins), css: merged.css };
      conflicted = conflicted || merged.conflicted;
    }

    if (sheet) {
      sheets[id] = sheet;
    }
  });

  const older = localWins ? r : l;
  const newest = localWins ? l : r;
  const active = [newest.active, older.active, ...Object.keys(sheets)].find(
    id => id in sheets
  );

  if (!active) {
    return { style: newer, conflicted };
  }

  if (!base?.profiles && !local.profiles && !remote.profiles) {
    return { style: { ...newer, css: sheets[active].css }, conflicted };
  }

  return {
    style: collapseProfiles(newer, { active, sheets }),
    conflicted,
  };
};

/**
 * A copy stripped of its profiles by a version of Stylebot that predates
 * them, given back the base's profiles with its css as the active one.
 */
const restoreProfiles = (
  base: StyleWithoutUrl | undefined,
  side: StyleWithoutUrl | undefined
) => {
  if (!base?.profiles || !side || side.profiles) {
    return side;
  }

  const { active, sheets } = expandProfiles(base);

  return collapseProfiles(side, {
    active,
    sheets: { ...sheets, [active]: { ...sheets[active], css: side.css } },
  });
};

/**
 * Merges local and remote against the base they both descend from — the map
 * as it stood after the last sync. Given the base, a style missing on one side
 * is a deletion to carry over rather than an addition to restore, and a style
 * edited on both sides is merged rather than one copy dropped.
 *
 * Per url:
 *   unchanged on both sides         → keep
 *   changed on one side only        → take that side (including its deletion)
 *   changed identically on both     → keep
 *   edited on one, deleted on other → keep the edit
 *   edited differently on both      → mergeStyle
 *
 * Without a base there is nothing to deduce from, so the newest-wins union
 * stands in — once, on a device's first sync.
 */
export const mergeThreeWay = (
  base: StyleMap | undefined,
  local: StyleMap,
  remote: StyleMap,
  at: string
): StyleMergeResult => {
  if (!base) {
    return { styles: mergeWithoutBase(local, remote), conflicts: [] };
  }

  const styles: StyleMap = {};
  const conflicts: Array<string> = [];
  const urls = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote),
  ]);

  urls.forEach(url => {
    const b = base[url];
    const l = restoreProfiles(b, local[url]);
    const r = restoreProfiles(b, remote[url]);

    const localChanged = !isEquivalentStyle(b, l);
    const remoteChanged = !isEquivalentStyle(b, r);

    let result: StyleWithoutUrl | undefined;

    if (!localChanged && !remoteChanged) {
      result = l;
    } else if (!localChanged || !remoteChanged) {
      const changed = localChanged ? l : r;
      // Merged anyway when profiles are involved, so a stale copy can't
      // take a profile the other side still has.
      result =
        l && r && (b?.profiles || l.profiles || r.profiles)
          ? mergeStyle(b, l, r, at).style
          : changed;
    } else if (!l || !r) {
      // Deleted on one side and edited on the other keeps the edit; deleted
      // on both stays deleted.
      result = l ?? r;
    } else if (isEquivalentStyle(l, r)) {
      result = parseTime(l.modifiedTime) >= parseTime(r.modifiedTime) ? l : r;
    } else {
      const merged = mergeStyle(b, l, r, at);
      result = merged.style;

      if (merged.conflicted) {
        conflicts.push(url);
      }
    }

    if (result) {
      styles[url] = result;
    }
  });

  return { styles, conflicts };
};
