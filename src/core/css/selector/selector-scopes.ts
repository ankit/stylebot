import type { SelectorDescription } from './get-selector';
import { countSelectorSteps, isSimpleSelector } from './selector-text';

/**
 * Other ways to select an element: the style's selectors that already
 * match it, then selectors built for it, most stable first. No two match
 * the same set of elements.
 */
export type SelectorAlternatives = {
  existing: Array<string>;
  // The selectors that could fill a scope, saved rules among them.
  candidates: Array<string>;
  // How much each candidate covers: similar elements or all.
  descriptions?: Record<string, SelectorDescription>;
  // How many elements each candidate matches.
  counts?: Record<string, number>;
};

export type ScopeSlots = {
  only?: string;
  similar?: string;
  all?: string;
};

type Descriptions = SelectorAlternatives['descriptions'];

const getMatchCount = (
  { counts = {} }: SelectorAlternatives,
  selector: string
): number => counts[selector] ?? 0;

const isFallback = (descriptions: Descriptions = {}, selector: string) =>
  !!descriptions[selector]?.fallback;

/**
 * Returns the selector that matches the most elements; of those that tie,
 * the earliest. Fallbacks are skipped unless they're all there is.
 */
const widest = (
  selectors: Array<string>,
  alternatives: SelectorAlternatives
): string | undefined => {
  const nearer = selectors.filter(
    selector => !isFallback(alternatives.descriptions, selector)
  );
  const pool = nearer.length ? nearer : selectors;

  return pool.reduce<string | undefined>((best, selector) => {
    const wider =
      !best ||
      getMatchCount(alternatives, selector) > getMatchCount(alternatives, best);

    return wider ? selector : best;
  }, undefined);
};

/**
 * Whether a selector is a lone id, like `#karma`.
 */
const isIdSelector = (selector: string): boolean =>
  selector.startsWith('#') && countSelectorSteps(selector) === 1;

/**
 * Returns a selector that matches just the picked element: a saved rule
 * whatever its shape, else the element's id, else a short one.
 */
const getOnlyScope = (
  alternatives: SelectorAlternatives
): string | undefined => {
  const { candidates, existing } = alternatives;
  const unique = candidates.filter(
    selector => getMatchCount(alternatives, selector) === 1
  );

  return (
    unique.find(selector => existing.includes(selector)) ??
    unique.find(isIdSelector) ??
    unique.find(isSimpleSelector)
  );
};

/**
 * Returns the selector for elements like the picked one, e.g. every story's
 * title. A saved rule that already does this wins over a suggestion.
 */
const getSimilarScope = (
  alternatives: SelectorAlternatives
): string | undefined => {
  const { candidates, existing, descriptions = {} } = alternatives;
  const similar = candidates.filter(
    selector =>
      descriptions[selector]?.role === 'similar' &&
      getMatchCount(alternatives, selector) > 1
  );
  const saved = similar.find(
    selector =>
      existing.includes(selector) && !isFallback(descriptions, selector)
  );

  return saved ?? widest(similar, alternatives);
};

/**
 * Returns the most stable candidate that reaches past the Similar scope: a
 * saved rule, else the earliest suggestion. Fallbacks are skipped unless
 * they're all there is.
 */
const getAllScope = (
  alternatives: SelectorAlternatives,
  similarScope: string | undefined
): string | undefined => {
  const { candidates, descriptions } = alternatives;
  const similarCount = similarScope
    ? getMatchCount(alternatives, similarScope)
    : 0;
  const floor = Math.max(1, similarCount);
  const wider = candidates.filter(
    selector => getMatchCount(alternatives, selector) > floor
  );
  const nearer = wider.find(selector => !isFallback(descriptions, selector));

  return nearer ?? wider[0];
};

/**
 * Picks a selector for each scope: Only, Similar and All, the most stable
 * one that reaches past Similar. A saved rule among the candidates fills
 * the scope it matches exactly.
 */
export const getScopeSlots = (
  alternatives: SelectorAlternatives
): ScopeSlots => {
  const similar = getSimilarScope(alternatives);

  return {
    only: getOnlyScope(alternatives),
    similar,
    all: getAllScope(alternatives, similar),
  };
};

/**
 * Returns the scope, or nothing when it's a fallback.
 */
const unlessFallback = (
  scope: string | undefined,
  descriptions: Descriptions
): string | undefined =>
  scope && !isFallback(descriptions, scope) ? scope : undefined;

/**
 * Returns the scope the field starts on after a pick, the first that
 * exists: the one holding a saved rule, Similar, Only, All, then the Similar
 * and All fallbacks. Undefined keeps the pick.
 */
export const getDefaultScope = (
  alternatives: SelectorAlternatives
): string | undefined => {
  const { existing, descriptions } = alternatives;
  const { only, similar, all } = getScopeSlots(alternatives);
  const saved = [only, similar, all].find(
    scope => scope && existing.includes(scope)
  );
  const preferred = [
    saved,
    unlessFallback(similar, descriptions),
    only,
    unlessFallback(all, descriptions),
    similar,
    all,
  ];

  return preferred.find(Boolean);
};
