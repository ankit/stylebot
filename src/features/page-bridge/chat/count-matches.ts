import { withoutStatePseudos } from './state-pseudos';

/**
 * How many of the page's elements each selector matches, leaving out
 * Stylebot's own UI, or null for a selector the page can't parse. A state
 * or pseudo-element counts the elements it's on (`a:hover` as `a`).
 */
export const countMatches = (selectors: Array<string>): Array<number | null> =>
  selectors.map(selector => {
    try {
      return Array.from(
        document.querySelectorAll(withoutStatePseudos(selector))
      ).filter(element => !element.closest('#stylebot')).length;
    } catch {
      return null;
    }
  });
