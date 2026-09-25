import { VersionChange, VersionPreview, StyleMap } from '@stylebot/types';

import { isEquivalentStyle } from '@stylebot/styles';

/**
 * How `after` differs from `before`, read forwards: what it has gained, what
 * it keeps but writes differently, and what it has lost.
 */
export const diffStyles = (
  before: StyleMap,
  after: StyleMap
): VersionChange => ({
  addedUrls: Object.keys(after)
    .filter(url => !before[url])
    .sort(),
  changedUrls: Object.keys(after)
    .filter(
      url =>
        before[url] &&
        before[url] !== after[url] &&
        !isEquivalentStyle(before[url], after[url])
    )
    .sort(),
  removedUrls: Object.keys(before)
    .filter(url => !after[url])
    .sort(),
});

/**
 * What restoring a version would do to the live styles: the same difference,
 * measured from where you are now.
 */
export const getVersionPreview = (
  current: StyleMap,
  version: StyleMap
): VersionPreview => ({
  styleCount: Object.keys(version).length,
  ...diffStyles(current, version),
});
