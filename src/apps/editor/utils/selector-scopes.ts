import { isSimpleSelector } from '@stylebot/css';
import type { SelectorAlternatives } from '@stylebot/page-bridge';

export type ScopeSlots = { only?: string; similar?: string; all?: string };

/**
 * Picks a selector for each scope pill.
 * Only: a short selector that matches just the picked element.
 * Similar: the widest one suggested for the same spot in every block alike.
 * All: the pick, else the widest candidate, when it reaches past Similar.
 */
export const getScopeSlots = (
  { selector: picked, candidates, descriptions = {} }: SelectorAlternatives,
  counts: Record<string, number | null>
): ScopeSlots => {
  const reach = (selector: string) => counts[selector] ?? 0;
  const only = candidates.find(
    selector => reach(selector) === 1 && isSimpleSelector(selector)
  );
  const similar = candidates
    .filter(
      selector =>
        descriptions[selector]?.role === 'similar' && reach(selector) > 1
    )
    .pop();
  const floor = Math.max(1, similar ? reach(similar) : 0);
  const wide = candidates.filter(selector => reach(selector) > floor);
  const all = picked && reach(picked) > floor ? picked : wide[wide.length - 1];

  return { only, similar, all };
};
