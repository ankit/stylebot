import { StyleMap, StyleWithoutUrl } from '@stylebot/types';

import { mergeCss } from './merge-css';
import { mergeWithoutBase } from './merge-without-base';

export type StyleMergeResult = {
  styles: StyleMap;
  // Urls whose css had lines parked in a conflict comment.
  conflicts: Array<string>;
};

/**
 * Whitespace-insensitive view of a stylesheet, so reformatting on one device
 * does not read as an edit.
 */
const normalizeCss = (css: string) => css.replace(/\s+/g, ' ').trim();

/**
 * Two copies are equivalent when they would behave the same on a
 * page. modifiedTime is deliberately left out: it says when, not what.
 */
export const isEquivalentStyle = (
  a?: StyleWithoutUrl,
  b?: StyleWithoutUrl
): boolean => {
  if (!a || !b) {
    return !a && !b;
  }

  return (
    a.enabled === b.enabled &&
    a.readability === b.readability &&
    (a.forceImportant !== false) === (b.forceImportant !== false) &&
    normalizeCss(a.css) === normalizeCss(b.css)
  );
};

/**
 * Two maps are equivalent when they hold the same urls and every style
 * would behave the same on a page, however its timestamps or whitespace differ.
 */
export const isEquivalentStyleMap = (a: StyleMap, b: StyleMap): boolean => {
  const urls = Object.keys(a);

  return (
    urls.length === Object.keys(b).length &&
    urls.every(url => url in b && isEquivalentStyle(a[url], b[url]))
  );
};

const parseTime = (timestamp?: string) => {
  const time = new Date(timestamp ?? '').getTime();
  return Number.isNaN(time) ? 0 : time;
};

/**
 * Both sides changed the same style: flags follow the newer edit, css is
 * merged hunk by hunk against the base, and the newer edit wins any hunk
 * both sides rewrote.
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

  const { css, conflicted } = mergeCss(
    base?.css ?? '',
    local.css,
    remote.css,
    localWins,
    at
  );

  return {
    style: {
      css,
      enabled: newer.enabled,
      readability: newer.readability,
      modifiedTime: newer.modifiedTime,
      ...(newer.forceImportant === false ? { forceImportant: false } : {}),
    },
    conflicted,
  };
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
    const l = local[url];
    const r = remote[url];

    const localChanged = !isEquivalentStyle(b, l);
    const remoteChanged = !isEquivalentStyle(b, r);

    let result: StyleWithoutUrl | undefined;

    if (!localChanged && !remoteChanged) {
      result = l;
    } else if (!localChanged) {
      result = r;
    } else if (!remoteChanged) {
      result = l;
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
