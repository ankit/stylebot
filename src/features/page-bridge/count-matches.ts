/**
 * How many of the page's elements each selector matches, leaving out
 * Stylebot's own UI, or null for a selector the page can't parse.
 */
export const countMatches = (selectors: Array<string>): Array<number | null> =>
  selectors.map(selector => {
    try {
      return Array.from(document.querySelectorAll(selector)).filter(
        element => !element.closest('#stylebot')
      ).length;
    } catch {
      return null;
    }
  });
