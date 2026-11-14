import { getDefaultSelector } from '@stylebot/css';
import type { PointerResult } from '@stylebot/types';

import { countMatches } from './page-reading';
import { getSelectorAlternatives } from './selector-alternatives';

/**
 * The selector the editor's field starts on when the element is picked,
 * preferring one the style's css has, with the alternatives the editor's
 * selector menu offers.
 */
export const inspectElement = (
  el: HTMLElement,
  css: string
): Pick<PointerResult, 'selector' | 'matches' | 'alternatives'> => {
  const alternatives = getSelectorAlternatives(el, css);
  const { existing, candidates, counts: reach = {} } = alternatives;
  const selector = getDefaultSelector(el, alternatives);
  const narrowestFirst = [...candidates].sort((a, b) => reach[a] - reach[b]);
  const others = Array.from(new Set([...existing, ...narrowestFirst])).filter(
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
