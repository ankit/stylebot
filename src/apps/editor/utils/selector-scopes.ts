import { isSimpleSelector } from '@stylebot/css';
import type { SelectorAlternatives } from '@stylebot/page-bridge';

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
 * Returns a selector that matches just the picked element: a saved rule
 * whatever its shape, else a short one.
 */
const getOnlyScope = (
  alternatives: SelectorAlternatives
): string | undefined => {
  const { candidates, existing } = alternatives;

  return candidates.find(
    selector =>
      getMatchCount(alternatives, selector) === 1 &&
      (existing.includes(selector) || isSimpleSelector(selector))
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
 * Returns the widest candidate that reaches past the Similar scope.
 */
const getAllScope = (
  alternatives: SelectorAlternatives,
  similarScope: string | undefined
): string | undefined => {
  const similarCount = similarScope
    ? getMatchCount(alternatives, similarScope)
    : 0;
  const floor = Math.max(1, similarCount);
  const wider = alternatives.candidates.filter(
    selector => getMatchCount(alternatives, selector) > floor
  );

  return widest(wider, alternatives);
};

/**
 * Picks a selector for each scope: Only, Similar and All. A saved rule
 * among the candidates fills the scope it matches exactly.
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
