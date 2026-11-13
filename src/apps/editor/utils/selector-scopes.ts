import { isSimpleSelector } from '@stylebot/css';
import type { SelectorAlternatives } from '@stylebot/page-bridge';

export type ScopeSlots = { only?: string; all?: string };

/**
 * Picks a selector for each scope pill.
 * Only: a short selector that matches just the picked element.
 * All: the inspector's pick if it matches more than one element,
 * otherwise the candidate that matches the most.
 */
export const getScopeSlots = (
  { selector: picked, candidates }: SelectorAlternatives,
  counts: Record<string, number | null>
): ScopeSlots => {
  const reach = (selector: string) => counts[selector] ?? 0;
  const only = candidates.find(
    selector => reach(selector) === 1 && isSimpleSelector(selector)
  );
  const wide = candidates.filter(selector => reach(selector) > 1);
  const all = picked && reach(picked) > 1 ? picked : wide[wide.length - 1];

  return { only, all };
};
