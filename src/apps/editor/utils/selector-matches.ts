import { getPageBridge } from '@stylebot/page-bridge';

const PSEUDO_ELEMENT = /::|:(before|after|first-line|first-letter)\b/i;

/**
 * How many of the page's elements each selector matches, keyed by selector.
 * A pseudo-element isn't an element the page can count, so it'd read 0;
 * those are left out.
 */
export const countSelectorMatches = async (
  selectors: Array<string>
): Promise<Record<string, number | null>> => {
  const countable = selectors.filter(
    selector => selector && !PSEUDO_ELEMENT.test(selector)
  );
  const counts = await getPageBridge().countMatches(countable);

  return Object.fromEntries(
    countable.map((selector, i) => [selector, counts[i]])
  );
};
