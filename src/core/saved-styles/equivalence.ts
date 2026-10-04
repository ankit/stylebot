import type { StyleMap, StyleWithoutUrl } from '@stylebot/types';

import { isForceImportant } from './force-important';
import { expandProfiles } from './profiles';

/**
 * Whitespace-insensitive view of a stylesheet, so reformatting on one device
 * does not read as an edit.
 */
const normalizeCss = (css: string) => css.replace(/\s+/g, ' ').trim();

/**
 * Whether two stylesheets differ only in whitespace.
 */
export const isEquivalentCss = (a: string, b: string): boolean =>
  normalizeCss(a) === normalizeCss(b);

/**
 * Whether profiles compare by which one is applied. Sync leaves it out,
 * since each device keeps its own.
 */
type EquivalenceOptions = { ignoreActiveProfile?: boolean };

/**
 * Whether both styles have the same profiles, the same one active, and each
 * profile the same name and css. A style without profiles matches one whose
 * only profile is the unnamed default.
 */
const hasEquivalentProfiles = (
  a: StyleWithoutUrl,
  b: StyleWithoutUrl,
  { ignoreActiveProfile = false }: EquivalenceOptions
) => {
  const expandedA = expandProfiles(a);
  const expandedB = expandProfiles(b);
  const ids = Object.keys(expandedA.sheets);

  return (
    (ignoreActiveProfile || expandedA.active === expandedB.active) &&
    ids.length === Object.keys(expandedB.sheets).length &&
    ids.every(id => {
      const sheetA = expandedA.sheets[id];
      const sheetB = expandedB.sheets[id];

      return (
        !!sheetB &&
        sheetA.name === sheetB.name &&
        normalizeCss(sheetA.css) === normalizeCss(sheetB.css)
      );
    })
  );
};

/**
 * Two copies are equivalent when they would behave the same on a page.
 * modifiedTime is deliberately left out: it says when, not what.
 */
export const isEquivalentStyle = (
  a?: StyleWithoutUrl,
  b?: StyleWithoutUrl,
  options: EquivalenceOptions = {}
): boolean => {
  if (!a || !b) {
    return !a && !b;
  }

  return (
    a.enabled === b.enabled &&
    a.readability === b.readability &&
    isForceImportant(a) === isForceImportant(b) &&
    hasEquivalentProfiles(a, b, options)
  );
};

/**
 * Two maps are equivalent when they hold the same urls and every style would
 * behave the same on a page, however its timestamps or whitespace differ.
 */
export const isEquivalentStyleMap = (
  a: StyleMap,
  b: StyleMap,
  options: EquivalenceOptions = {}
): boolean => {
  const urls = Object.keys(a);

  return (
    urls.length === Object.keys(b).length &&
    urls.every(url => url in b && isEquivalentStyle(a[url], b[url], options))
  );
};
