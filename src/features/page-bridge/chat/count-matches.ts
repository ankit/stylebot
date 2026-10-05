import { withoutStatePseudos } from './state-pseudos';

/**
 * The page's elements the selector matches, leaving out Stylebot's own UI,
 * up to a limit, or null for a selector the page can't parse.
 */
export const queryPage = (
  selector: string,
  limit = Infinity
): Array<Element> | null => {
  let all: NodeListOf<Element>;

  try {
    all = document.querySelectorAll(selector);
  } catch {
    return null;
  }

  const found: Array<Element> = [];

  for (let i = 0; i < all.length && found.length < limit; i++) {
    if (!all[i].closest('#stylebot')) {
      found.push(all[i]);
    }
  }

  return found;
};

/**
 * How many of the page's elements each selector matches, leaving out
 * Stylebot's own UI, or null for a selector the page can't parse. A state
 * or pseudo-element counts the elements it's on (`a:hover` as `a`).
 */
export const countMatches = (selectors: Array<string>): Array<number | null> =>
  selectors.map(
    selector => queryPage(withoutStatePseudos(selector))?.length ?? null
  );
