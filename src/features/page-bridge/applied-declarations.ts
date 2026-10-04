import { getMatchingSelectors } from '@stylebot/css';
import type { CssDeclaration } from '@stylebot/types';

import {
  getEffectiveDeclarations,
  resolveValue,
} from './effective-declarations';

/**
 * A declaration from one of the user's Stylebot styles that wins on an
 * element, with the selector it comes from.
 */
export type AppliedDeclaration = CssDeclaration & { selector: string };

/**
 * The selector as the browser serializes it, which is how the page's
 * stylesheets report it (`div>p` comes back as `div > p`).
 */
const serializeSelector = (selector: string): string => {
  try {
    const sheet = new CSSStyleSheet();
    sheet.insertRule(`${selector} {}`);

    return (sheet.cssRules[0] as CSSStyleRule).selectorText;
  } catch {
    return selector;
  }
};

/**
 * The user's Stylebot declarations that win on `el`, one per property,
 * weighed against the page's own CSS too. Each carries its selector as
 * written in `css`, not as the browser serialized it.
 */
export const getAppliedDeclarations = (
  el: HTMLElement,
  css: string
): Array<AppliedDeclaration> => {
  const computed = getComputedStyle(el);
  const written = new Map(
    getMatchingSelectors(el, css).map(selector => [
      serializeSelector(selector),
      selector,
    ])
  );

  return Array.from(getEffectiveDeclarations(el, { stylebot: true }))
    .filter(([, candidate]) => candidate.stylebot)
    .map(([property, { value, selector }]) => ({
      property,
      value: resolveValue(computed, property, value),
      selector: written.get(selector) ?? selector,
    }));
};
