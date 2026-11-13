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
 * Keeps the first of any selectors that match exactly the same elements,
 * so a list only offers choices that change what gets styled.
 */
export const dedupeByMatches = (selectors: Array<string>): Array<string> => {
  const kept: Array<{ selector: string; matches: Array<Element> }> = [];

  for (const selector of new Set(selectors)) {
    const matches = matchesOf(selector);
    const duplicate = kept.some(
      other =>
        other.matches.length === matches.length &&
        other.matches.every((match, i) => match === matches[i])
    );

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
