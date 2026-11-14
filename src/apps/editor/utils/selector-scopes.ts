import { isSimpleSelector } from '@stylebot/css';
import type { SelectorAlternatives } from '@stylebot/page-bridge';

export type ScopeSlots = {
  only?: string;
  similar?: string;
  all?: string;
  styled?: string;
};

type Counts = Record<string, number | null>;

const getMatchCount = (counts: Counts, selector: string): number =>
  counts[selector] ?? 0;

/**
 * Returns the widest selector, the last in a list sorted narrowest first.
 * Fallbacks are skipped unless they're all there is.
 */
const widest = (
  selectors: Array<string>,
  descriptions: SelectorAlternatives['descriptions'] = {}
): string | undefined => {
  const nearer = selectors.filter(
    selector => !descriptions[selector]?.fallback
  );
  const pool = nearer.length ? nearer : selectors;

  return pool[pool.length - 1];
};

/**
 * Returns a short selector that matches just the picked element.
 */
const getOnlyScope = (
  { candidates }: SelectorAlternatives,
  counts: Counts
): string | undefined =>
  candidates.find(
    selector =>
      getMatchCount(counts, selector) === 1 && isSimpleSelector(selector)
  );

/**
 * Returns the selector for elements like the picked one, e.g. every story's
 * title. A saved rule that already does this wins over a suggestion.
 */
const getSimilarScope = (
  { styled, candidates, descriptions = {} }: SelectorAlternatives,
  counts: Counts
): string | undefined => {
  const styledDescription = styled ? descriptions[styled] : undefined;

  if (styledDescription?.role === 'similar' && !styledDescription.fallback) {
    return styled;
  }

  const similar = candidates.filter(
    selector =>
      descriptions[selector]?.role === 'similar' &&
      getMatchCount(counts, selector) > 1
  );

  return widest(similar, descriptions);
};

/**
 * Returns the pick when it reaches past the Similar scope, else the widest
 * candidate that does.
 */
const getAllScope = (
  { selector: picked, styled, candidates, descriptions }: SelectorAlternatives,
  counts: Counts,
  similarScope: string | undefined
): string | undefined => {
  const similarCount = similarScope ? getMatchCount(counts, similarScope) : 0;
  const floor = Math.max(1, similarCount);

  if (picked && picked !== styled && getMatchCount(counts, picked) > floor) {
    return picked;
  }

  const wider = candidates.filter(
    selector => getMatchCount(counts, selector) > floor
  );

  return widest(wider, descriptions);
};

/**
 * Picks a selector for each scope pill: Only, Similar and All, then Styled,
 * the style's own rule for the element whatever its shape. Similar is left
 * out when the Styled rule already is that spot.
 */
export const getScopeSlots = (
  alternatives: SelectorAlternatives,
  counts: Counts
): ScopeSlots => {
  const { styled } = alternatives;
  const similarScope = getSimilarScope(alternatives, counts);

  const only = getOnlyScope(alternatives, counts);
  const similar = similarScope === styled ? undefined : similarScope;
  const all = getAllScope(alternatives, counts, similarScope);
  const styledCounted = !!styled && getMatchCount(counts, styled) > 0;
  const styledScope = styledCounted ? styled : undefined;

  return { only, similar, all, styled: styledScope };
};
