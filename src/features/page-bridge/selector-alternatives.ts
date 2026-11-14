import {
  dedupeByMatches,
  getMatchingSelectors,
  getSelectorSuggestions,
  isPageWideSelector,
  matchesOf,
  sameElements,
} from '@stylebot/css';
import type { SelectorDescription } from '@stylebot/css';

import type { SelectorAlternatives } from './PageBridge';
import { getAppliedDeclarations } from './applied-declarations';

type MatchesFor = (selector: string) => Array<Element>;

/**
 * Returns the style's selectors that match `el`. A page-wide one, like `*`
 * or `body`, counts only when it sets something on `el`, and goes last.
 */
const getSavedSelectors = (el: HTMLElement, css: string): Array<string> => {
  const matching = getMatchingSelectors(el, css);
  const applied = getAppliedDeclarations(el, css).map(d => d.selector);
  const winning = new Set(applied);

  return [
    ...matching.filter(s => !isPageWideSelector(s)),
    ...matching.filter(s => isPageWideSelector(s) && winning.has(s)),
  ];
};

/**
 * Returns a lookup of each selector's matched elements that queries the
 * page once per selector.
 */
const createMatchesCache = (): MatchesFor => {
  const cache = new Map<string, Array<Element>>();

  return selector =>
    cache.get(selector) ??
    cache.set(selector, matchesOf(selector)).get(selector)!;
};

/**
 * Labels each kept selector with the role of a suggestion that matches the
 * same elements, so a dropped duplicate still gets its pill. When several
 * apply, Similar wins, unless it would replace a nearer Similar.
 */
const getDescriptions = (
  suggestions: ReturnType<typeof getSelectorSuggestions>,
  kept: Array<string>,
  matchesFor: MatchesFor
): Record<string, SelectorDescription> => {
  const descriptions: Record<string, SelectorDescription> = {};

  for (const { selector: suggested, description } of suggestions) {
    const reaches = matchesFor(suggested);
    const home = kept.find(other => sameElements(matchesFor(other), reaches));
    const current = home ? descriptions[home] : undefined;
    const nearerSimilar = current?.role === 'similar' && !current.fallback;
    const replaces =
      !current || (description?.role === 'similar' && !nearerSimilar);

    if (home && description && replaces) {
      descriptions[home] = description;
    }
  }

  return descriptions;
};

/**
 * Returns the style's selectors that match `el`, and the selectors that
 * could fill a scope with how many elements each matches, narrowest first.
 */
export const getSelectorAlternatives = (
  el: HTMLElement,
  css: string
): SelectorAlternatives => {
  const existing = getSavedSelectors(el, css);
  const suggestions = getSelectorSuggestions(el);
  const matchesFor = createMatchesCache();

  // Of selectors that match the same elements, the earliest is kept, so a
  // saved rule stands in for a suggestion that reaches what it does.
  const kept = dedupeByMatches(
    [...existing, ...suggestions.map(s => s.selector)],
    matchesFor
  );
  const descriptions = getDescriptions(suggestions, kept, matchesFor);
  const countOf = (selector: string) => matchesFor(selector).length;

  // A saved rule fills a scope only when it matches just `el`, or exactly
  // what a suggestion does; the suggestion then lent it its description.
  const fillsScope = (selector: string) => {
    if (!existing.includes(selector)) {
      return true;
    }

    const exact = !!descriptions[selector] || countOf(selector) === 1;

    return exact && !isPageWideSelector(selector);
  };

  const candidates = kept
    .filter(fillsScope)
    .sort((a, b) => countOf(a) - countOf(b));
  const counts = Object.fromEntries(candidates.map(s => [s, countOf(s)]));

  return { existing, candidates, descriptions, counts };
};
