import {
  byReach,
  dedupeByMatches,
  getMatchingSelectors,
  getSelectorSuggestions,
  matchesOf,
  sameElements,
} from '@stylebot/css';
import type { SelectorDescription } from '@stylebot/css';

import type { SelectorAlternatives } from './PageBridge';
import { getAppliedDeclarations } from './applied-declarations';

const PAGE_WIDE_SELECTOR = /^\s*(\*|html|body|:root)\s*$/i;

/**
 * Returns the saved rule the Styled pill offers: the current selector when
 * it's saved, else the saved rule that matches the fewest elements.
 */
const getStyledSelector = (
  selector: string,
  existing: Array<string>
): string | undefined => {
  if (existing.includes(selector)) {
    return selector;
  }

  const notPageWide = existing.filter(s => !PAGE_WIDE_SELECTOR.test(s));

  return byReach(notPageWide)[0];
};

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
    ...matching.filter(s => !PAGE_WIDE_SELECTOR.test(s)),
    ...matching.filter(s => PAGE_WIDE_SELECTOR.test(s) && winning.has(s)),
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
 * Returns the style's own selectors that match `el`, then generated ones
 * that reach a different set of elements than the current selector and those.
 */
export const getSelectorAlternatives = (
  el: HTMLElement,
  selector: string,
  css: string
): SelectorAlternatives => {
  const existing = getSavedSelectors(el, css);
  const styled = getStyledSelector(selector, existing);
  const suggestions = getSelectorSuggestions(el);
  const matchesFor = createMatchesCache();

  // Of selectors that match the same elements, the earliest is kept: the
  // Styled rule first, so no suggestion repeats it, then the saved rules.
  const ordered = [
    styled,
    selector,
    ...existing,
    ...suggestions.map(s => s.selector),
  ].filter((s): s is string => !!s);
  const kept = dedupeByMatches(ordered, matchesFor);
  // Includes the current selector, so the panel can tell the options still
  // belong to it.
  const candidates = byReach(kept.filter(s => !existing.includes(s)));
  const descriptions = getDescriptions(suggestions, kept, matchesFor);

  return { selector, existing, styled, candidates, descriptions };
};
