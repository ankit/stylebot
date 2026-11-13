import { queryWithShadowRoots } from '@stylebot/stylesheets';

export const countMatches = (selector: string): number => {
  try {
    return queryWithShadowRoots(selector).length;
  } catch {
    return 0;
  }
};

export const elementMatches = (el: Element, selector: string): boolean => {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
};

export const matchesOf = (selector: string): Array<Element> => {
  try {
    return queryWithShadowRoots(selector);
  } catch {
    return [];
  }
};

/**
 * Whether two lists of matches hold the same elements in the same order.
 */
export const sameElements = (a: Array<Element>, b: Array<Element>): boolean =>
  a.length === b.length && a.every((match, i) => match === b[i]);

/**
 * Keeps the first of any selectors that match exactly the same elements,
 * so a list only offers choices that change what gets styled. `matchesFor`
 * lets a caller that queries the same selectors again cache them.
 */
export const dedupeByMatches = (
  selectors: Array<string>,
  matchesFor: (selector: string) => Array<Element> = matchesOf
): Array<string> => {
  const kept: Array<{ selector: string; matches: Array<Element> }> = [];

  for (const selector of new Set(selectors)) {
    const matches = matchesFor(selector);
    const duplicate = kept.some(other => sameElements(other.matches, matches));

    if (!duplicate) {
      kept.push({ selector, matches });
    }
  }

  return kept.map(({ selector }) => selector);
};

/**
 * Sorts selectors narrowest first, by how many elements each matches.
 */
export const byReach = (selectors: Array<string>): Array<string> =>
  selectors
    .map(selector => ({ selector, count: countMatches(selector) }))
    .sort((a, b) => a.count - b.count)
    .map(({ selector }) => selector);
