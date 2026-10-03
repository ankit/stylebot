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
 * The user's Stylebot declarations that win on `el`, one per property,
 * weighed against the page's own CSS too.
 */
export const getAppliedDeclarations = (
  el: Element
): Array<AppliedDeclaration> => {
  const computed = getComputedStyle(el);

  return Array.from(getEffectiveDeclarations(el, { stylebot: true }))
    .filter(([, candidate]) => candidate.stylebot)
    .map(([property, { value, selector }]) => ({
      property,
      value: resolveValue(computed, property, value),
      selector,
    }));
};
