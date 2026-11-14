import { countMatches } from './reach';

/**
 * How much a suggested selector covers, as the scope pills offer it: only
 * the picked element, the same kind of element in every block like its
 * own, or everything broader.
 */
export type SelectorRole = 'only' | 'similar' | 'all';

/**
 * A suggestion's role, and whether it's a fallback named by something far
 * off (a whole named area), offered only when nothing nearer fills its pill.
 */
export type SelectorDescription = { role: SelectorRole; fallback?: boolean };

/**
 * Describes a suggestion made as `role`; any that reaches the picked
 * element alone is "only".
 */
export const describeSelector = (
  selector: string,
  role: Exclude<SelectorRole, 'only'>,
  fallback = false
): SelectorDescription => ({
  role: countMatches(selector) === 1 ? 'only' : role,
  fallback,
});
