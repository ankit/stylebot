import { getSelectorSuggestions } from './get-selector';
import type { SelectorDescription } from './get-selector';
import { createMatchesCache, dedupeByMatches, sameElements } from './reach';
import type { MatchesFor } from './reach';
import { getDefaultScope } from './selector-scopes';
import type { SelectorAlternatives } from './selector-scopes';
import { isPageWideSelector } from './selector-text';

type Suggestions = ReturnType<typeof getSelectorSuggestions>;

/**
 * Labels each kept selector with the role of a suggestion that matches the
 * same elements, so a dropped duplicate still gets its pill. When several
 * apply, Similar wins, unless it would replace a nearer Similar.
 */
const getDescriptions = (
  suggestions: Suggestions,
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
 * Returns the selectors that could fill a scope for `el`, with how many
 * elements each matches, most stable first: the style's selectors that
 * match it (`existing`), then suggestions in the order they were built.
 * `matchesFor` lets a caller naming many elements share one cache.
 */
export const buildSelectorAlternatives = (
  el: HTMLElement,
  existing: Array<string> = [],
  matchesFor: MatchesFor = createMatchesCache()
): SelectorAlternatives => {
  const suggestions = getSelectorSuggestions(el);

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

  const candidates = kept.filter(fillsScope);
  const counts = Object.fromEntries(candidates.map(s => [s, countOf(s)]));

  return { existing, candidates, descriptions, counts };
};

/**
 * Returns the selector the editor's field starts on when `el` is picked:
 * its default scope, else the most stable candidate, else its tag name.
 */
export const getDefaultSelector = (
  el: HTMLElement,
  alternatives: SelectorAlternatives = buildSelectorAlternatives(el)
): string =>
  getDefaultScope(alternatives) ??
  alternatives.candidates[0] ??
  el.tagName.toLowerCase();
