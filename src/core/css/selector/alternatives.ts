import { countMatches } from './reach';
import {
  getClassBasedSelector,
  getDescriptiveSelector,
  getLabelBasedSelector,
  getNameBasedSelector,
  getNonHashedClassBasedSelector,
  getStableClassPartsSelector,
  getStableIdBasedSelector,
  getTestIdBasedSelector,
} from './element-selectors';
import {
  getAncestorBasedSelector,
  getAncestorHashedClassSelector,
  getAncestorScopedSelectors,
  getTagNameBasedSelector,
  isSweeping,
} from './ancestor-selectors';

// Tags that say what an element is, so "every one of them" is a real choice;
// span or div on their own are just containers.
const MEANINGFUL_TAGS = new Set([
  'a',
  'article',
  'aside',
  'blockquote',
  'button',
  'code',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'img',
  'input',
  'label',
  'li',
  'nav',
  'ol',
  'p',
  'pre',
  'table',
  'td',
  'th',
  'tr',
  'ul',
]);

const getMeaningfulTagSelector = (el: HTMLElement): string | null => {
  const tag = el.tagName.toLowerCase();
  return MEANINGFUL_TAGS.has(tag) ? tag : null;
};

/**
 * `el`'s own name (or tag), with :nth-of-type when a sibling of the same
 * tag would match it too, e.g. `tr.athing:nth-of-type(3)`.
 */
const getPositionedStep = (el: HTMLElement): string => {
  const own = getDescriptiveSelector(el) ?? el.tagName.toLowerCase();
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
  const subject = getDescriptiveSelector(el) ?? el.tagName.toLowerCase();
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

/**
 * Every selector the strategies offer for `el` that actually matches
 * it, most readable first: its own names, then ancestor scopes, then
 * hashed classes and bare tags, then ones scoped to this element's item
 * and to this element alone. Ones sweeping most of the page are left out.
 */
export const getSelectorCandidates = (el: HTMLElement): Array<string> =>
  [
    getTestIdBasedSelector(el),
    getNonHashedClassBasedSelector(el),
    getNameBasedSelector(el),
    getStableClassPartsSelector(el),
    getAncestorBasedSelector(el),
    ...getAncestorScopedSelectors(el),
    getStableIdBasedSelector(el),
    getLabelBasedSelector(el),
    getClassBasedSelector(el),
    getAncestorHashedClassSelector(el),
    getMeaningfulTagSelector(el),
    getTagNameBasedSelector(el),
    getItemScopedSelector(el),
    getUniqueSelector(el),
  ].filter((selector): selector is string => {
    try {
      return (
        Boolean(selector) &&
        el.matches(selector as string) &&
        !isSweeping(selector as string)
      );
    } catch {
      return false;
    }
  });
