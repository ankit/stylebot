import { countMatches } from './reach';

/**
 * How much a suggested selector covers, as the scope pills offer it: only
 * the picked element, the same kind of element in every block like its
 * own, or everything broader.
 */
export type SelectorRole = 'only' | 'similar' | 'all';

export type SelectorDescription = { role: SelectorRole };

/**
 * Describes a suggestion made as `role`; any that reaches the picked
 * element alone is "only".
 */
export const describeSelector = (
  selector: string,
  role: Exclude<SelectorRole, 'only'>
): SelectorDescription => ({
  role: countMatches(selector) === 1 ? 'only' : role,
});
