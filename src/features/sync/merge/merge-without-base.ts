import { compareAsc } from 'date-fns';
import type { StyleMap, StyleWithoutUrl } from '@stylebot/types';
import { collapseProfiles, expandProfiles } from '@stylebot/saved-styles';

/**
 * Returns 0 for an unparseable timestamp on either side, so the caller's
 * `> 0` test falls through to keeping the local style rather than comparing
 * against an Invalid Date.
 */
const compareModifiedTime = (t1?: string, t2?: string) => {
  const d1 = new Date(t1 ?? '');
  const d2 = new Date(t2 ?? '');

  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
    return 0;
  }

  return compareAsc(d1, d2);
};

/**
 * The winning copy of a style with any profiles only the losing copy has
 * added, so a profile made on one device before its first sync survives.
 */
const withMissingProfiles = (
  winner: StyleWithoutUrl,
  loser?: StyleWithoutUrl
): StyleWithoutUrl => {
  if (!loser?.profiles) {
    return winner;
  }

  const won = expandProfiles(winner);
  const lost = expandProfiles(loser);
  const missing = Object.keys(lost.sheets).filter(id => !(id in won.sheets));

  if (missing.length === 0) {
    return winner;
  }

  const sheets = { ...won.sheets };
  missing.forEach(id => {
    sheets[id] = lost.sheets[id];
  });

  return collapseProfiles(winner, { active: won.active, sheets });
};

/**
 * Merges local and remote with no record of what they last agreed on: the
 * union of both, newest modifiedTime winning per style. Only right for a
 * first sync or a reinstall — without a base a missing style cannot be told
 * apart from a deleted one, so nothing is ever removed.
 */
export const mergeWithoutBase = (
  local: StyleMap,
  remote: StyleMap
): StyleMap => {
  const styles: StyleMap = {};
  const urls = Object.keys(local);

  urls.forEach(url => {
    if (
      remote[url] &&
      compareModifiedTime(remote[url].modifiedTime, local[url].modifiedTime) > 0
    ) {
      styles[url] = withMissingProfiles(remote[url], local[url]);
    } else {
      styles[url] = withMissingProfiles(local[url], remote[url]);
    }
  });

  const remainingUrls = Object.keys(remote).filter(url => !urls.includes(url));
  remainingUrls.forEach(url => {
    styles[url] = remote[url];
  });

  return styles;
};
