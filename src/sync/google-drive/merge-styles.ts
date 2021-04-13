import { without } from 'lodash';
import { compareAsc } from 'date-fns';
import { StyleMap } from '@stylebot/types';

const compareModifiedTime = (t1: string, t2: string) => {
  return compareAsc(new Date(t1), new Date(t2));
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
    }

    styles[url] = local[url];
  });

  const remainingUrls = without(Object.keys(remote), ...urls);
  remainingUrls.forEach(url => {
    styles[url] = remote[url];
  });

  return styles;
};
