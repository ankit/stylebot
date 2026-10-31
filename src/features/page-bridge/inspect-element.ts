import { getExistingSelector, getSelector } from '@stylebot/css';
import type { PointerResult } from '@stylebot/types';

import { countMatches } from './page-reading';
import { getSelectorAlternatives } from './selector-alternatives';

/**
 * The selector the inspector would pick for an element, preferring one the
 * style's css has, with the alternatives the editor's selector menu offers.
 */
export const inspectElement = (
  el: HTMLElement,
  css: string
): Pick<PointerResult, 'selector' | 'matches' | 'alternatives'> => {
  const selector = getExistingSelector(el, css) ?? getSelector(el);
  const { existing, candidates } = getSelectorAlternatives(el, selector, css);
  const others = Array.from(new Set([...existing, ...candidates])).filter(
    other => other !== selector
  );
  const [matches, ...counts] = countMatches([selector, ...others]);

  return {
    selector,
    matches,
    alternatives: others.map((other, i) => ({
      selector: other,
      matches: counts[i],
      saved: existing.includes(other),
    })),
  };
};
