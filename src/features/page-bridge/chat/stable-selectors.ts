import { getStableSelector } from '@stylebot/css';

/**
 * Chat's selectors with each partly hashed class swapped for its stable
 * matcher, checked against this page, so its rules outlive a rebuild.
 */
export const getStableSelectors = (selectors: Array<string>): Array<string> =>
  selectors.map(selector => getStableSelector(selector));
