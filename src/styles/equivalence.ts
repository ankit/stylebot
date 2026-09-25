import { StyleMap, StyleWithoutUrl } from '@stylebot/types';

/**
 * Whitespace-insensitive view of a stylesheet, so reformatting on one device
 * does not read as an edit.
 */
const normalizeCss = (css: string) => css.replace(/\s+/g, ' ').trim();

/**
 * Two copies are equivalent when they would behave the same on a page.
 * modifiedTime is deliberately left out: it says when, not what.
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
 * Two maps are equivalent when they hold the same urls and every style would
 * behave the same on a page, however its timestamps or whitespace differ.
 */
export const isEquivalentStyleMap = (a: StyleMap, b: StyleMap): boolean => {
  const urls = Object.keys(a);

  return (
    urls.length === Object.keys(b).length &&
    urls.every(url => url in b && isEquivalentStyle(a[url], b[url]))
  );
};
