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
 * The style's own selectors that match `el`, then generated ones that
 * reach a different set of elements than the current selector and those.
 */
export const getSelectorAlternatives = (
  el: HTMLElement,
  selector: string,
  css: string
): SelectorAlternatives => {
  const matching = getMatchingSelectors(el, css);
  // A page-wide rule (* or body) matches everything, so it's worth offering
  // only when it actually sets something on this element; it goes last.
  const winning = new Set(getAppliedDeclarations(el, css).map(d => d.selector));
  const existing = [
    ...matching.filter(s => !PAGE_WIDE_SELECTOR.test(s)),
    ...matching.filter(s => PAGE_WIDE_SELECTOR.test(s) && winning.has(s)),
  ];
  // The style's rules are all kept, each with its own values; only the
  // generated ones give way to anything that already covers their reach.
  const suggestions = getSelectorSuggestions(el);
  const kept = dedupeByMatches([
    selector,
    ...existing,
    ...suggestions.map(suggestion => suggestion.selector),
  ]).map(keptSelector => ({
    selector: keptSelector,
    matches: matchesOf(keptSelector),
  }));
  const descriptions: Record<string, SelectorDescription> = {};

  // A suggestion folded into one that reaches the same elements passes its
  // description on, a similar one over any other, so its pill still shows.
  for (const { selector: suggested, description } of suggestions) {
    const reaches = matchesOf(suggested);
    const home = kept.find(other => sameElements(other.matches, reaches));

    if (
      home &&
      description &&
      (!descriptions[home.selector] || description.role === 'similar')
    ) {
      descriptions[home.selector] = description;
    }
  }

  return {
    selector,
    existing,
    // Includes the current selector, so the panel can tell the options
    // still belong to it.
    candidates: byReach(
      kept.map(k => k.selector).filter(s => !existing.includes(s))
    ),
    descriptions,
  };
};
