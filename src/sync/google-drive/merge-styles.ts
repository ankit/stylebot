import { compareAsc } from 'date-fns';
import { StyleMap } from '@stylebot/types';

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
 * Merge local and remote styles by comparing modifiedTime for each style.
 *
 * A few caveats:
 * - Conflicts in css for an individual style are not handled to keep logic simple.
 * - If a style is removed in either local or remote, it is retained since we don't record deletion timestamp.
 */
export default (local: StyleMap, remote: StyleMap): StyleMap => {
  const styles: StyleMap = {};
  const urls = Object.keys(local);

  urls.forEach(url => {
    if (
      remote[url] &&
      compareModifiedTime(remote[url].modifiedTime, local[url].modifiedTime) > 0
    ) {
      styles[url] = remote[url];
    } else {
      styles[url] = local[url];
    }
  });

  const remainingUrls = Object.keys(remote).filter(url => !urls.includes(url));
  remainingUrls.forEach(url => {
    styles[url] = remote[url];
  });

  return styles;
};
