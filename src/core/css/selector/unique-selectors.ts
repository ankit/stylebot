import { countMatches } from './reach';
import { getKindSelector, getStableIdBasedSelector } from './element-selectors';

/**
 * `el`'s own name (or tag), with :nth-of-type when a sibling of the same
 * tag would match it too, e.g. `tr.athing:nth-of-type(3)`.
 */
const getPositionedStep = (el: HTMLElement): string => {
  const own = getKindSelector(el) ?? el.tagName.toLowerCase();
  const siblings = Array.from(el.parentElement?.children ?? []).filter(
    sibling => sibling.tagName === el.tagName
  );
  const clashes = siblings.some(
    sibling => sibling !== el && sibling.matches(own)
  );

  return clashes ? `${own}:nth-of-type(${siblings.indexOf(el) + 1})` : own;
};

/**
 * A selector matching `el` and nothing else: its positioned step, prefixed
 * by each ancestor's in turn until only `el` matches, stopping at the
 * first ancestor with a unique #id the page didn't generate.
 */
export const getUniqueSelector = (el: HTMLElement): string | null => {
  let selector = '';

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const id = getStableIdBasedSelector(node);
    const step = id && countMatches(id) === 1 ? id : getPositionedStep(node);

    selector = selector ? `${step} ${selector}` : step;

    if (countMatches(selector) === 1) {
      return selector;
    }
  }

  return null;
};

/**
 * Elements like `el` within the nearest repeated ancestor it sits in (a
 * row, list item or card), e.g. every link in this one row: a step between
 * just this element and all of its kind.
 */
export const getItemScopedSelector = (el: HTMLElement): string | null => {
  const subject = getKindSelector(el) ?? el.tagName.toLowerCase();
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < 6; level++) {
    if (ancestor === document.body || ancestor === document.documentElement) {
      return null;
    }

    if (getPositionedStep(ancestor).includes(':nth-of-type(')) {
      const item = getUniqueSelector(ancestor);
      return item ? `${item} ${subject}` : null;
    }

    ancestor = ancestor.parentElement;
  }

  return null;
};
