import {
  buildSelectorAlternatives,
  getMatchingSelectors,
  isPageWideSelector,
} from '@stylebot/css';
import type { SelectorAlternatives } from '@stylebot/css';

import { getAppliedDeclarations } from './applied-declarations';

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
 * Returns the style's selectors that match `el`, and the selectors that
 * could fill a scope with how many elements each matches, most stable
 * first: saved rules, then suggestions in the order they were built.
 */
export const getSelectorAlternatives = (
  el: HTMLElement,
  css: string
): SelectorAlternatives =>
  buildSelectorAlternatives(el, getSavedSelectors(el, css));
