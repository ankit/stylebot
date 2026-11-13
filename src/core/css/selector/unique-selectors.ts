import { countMatches, elementMatches } from './reach';
import {
  getKindSelector,
  getLinkPath,
  getStableIdBasedSelector,
  isSharedLabel,
} from './element-selectors';
import { escapeAttributeValue } from './selector-text';
import { looksGeneratedId } from '../hashed-class';

const DISTINGUISHING_ATTRIBUTES = [
  'for',
  'name',
  'value',
  'href',
  'aria-label',
  'title',
  'alt',
];

// Short values that say what a child is, not a link address or tooltip.
const CHILD_ATTRIBUTES = ['for', 'name', 'value', 'aria-label', 'alt'];

const MAX_ATTRIBUTE_LENGTH = 80;
const MAX_CHILDREN = 5;

/**
 * `el`'s own name (or tag), and the siblings of the same tag it also fits.
 */
const getLookAlikes = (el: HTMLElement) => {
  const own = getKindSelector(el) ?? el.tagName.toLowerCase();
  const siblings = Array.from(el.parentElement?.children ?? []).filter(
    sibling => sibling.tagName === el.tagName
  );
  const rivals = siblings.filter(
    sibling => sibling !== el && elementMatches(sibling, own)
  );

  return { own, rivals, position: siblings.indexOf(el) + 1 };
};

/**
 * `node`'s value for `name`, or null when it's too long or generated. A
 * link's address counts only when it names a place on the site, which
 * already rules out long and generated ones.
 */
const getUsableValue = (node: Element, name: string): string | null => {
  if (name === 'href') {
    return getLinkPath(node as HTMLElement);
  }

  const value = node.getAttribute(name);
  if (!value || value.length > MAX_ATTRIBUTE_LENGTH) {
    return null;
  }

  if (name === 'aria-label' && !isSharedLabel(value)) {
    return null;
  }

  return looksGeneratedId(value) ? null : value;
};

/**
 * `node`'s attributes as `[name="value"]` tests, in the order they best say
 * what it is.
 */
const getAttributeTests = (
  node: Element,
  attributes: Array<string>
): Array<string> =>
  attributes.flatMap(name => {
    const value = getUsableValue(node, name);

    return value ? [`[${name}="${escapeAttributeValue(value)}"]`] : [];
  });

/**
 * `el`'s step told apart from look-alike siblings by what it is before where
 * it is: its own attribute, like `label[for="size-2"]`, else a child's, like
 * `div.radio:has(> input[value="2"])`, and failing both its position, like
 * `tr.athing:nth-of-type(3)`.
 */
const getDistinguishedStep = (el: HTMLElement): string => {
  const { own, rivals, position } = getLookAlikes(el);
  if (rivals.length === 0) {
    return own;
  }

  const ownTests = getAttributeTests(el, DISTINGUISHING_ATTRIBUTES).map(
    test => `${own}${test}`
  );
  const childTests = Array.from(el.children)
    .slice(0, MAX_CHILDREN)
    .flatMap(child =>
      getAttributeTests(child, CHILD_ATTRIBUTES).map(
        test => `${own}:has(> ${child.tagName.toLowerCase()}${test})`
      )
    );
  const tellsApart = (test: string) =>
    rivals.every(rival => !elementMatches(rival, test));

  return (
    [...ownTests, ...childTests].find(tellsApart) ??
    `${own}:nth-of-type(${position})`
  );
};

/**
 * Leaves out each ancestor step `el` is still singled out without, keeping
 * any #id it's anchored at, e.g. `#menu div ul li.item:nth-of-type(3) a` →
 * `#menu li.item:nth-of-type(3) a`.
 */
const dropRedundantSteps = (steps: Array<string>): Array<string> => {
  let kept = steps;

  for (let i = kept.length - 2; i >= 0; i--) {
    const without = [...kept.slice(0, i), ...kept.slice(i + 1)];

    if (!kept[i].startsWith('#') && countMatches(without.join(' ')) === 1) {
      kept = without;
    }
  }

  return kept;
};

/**
 * A selector matching only `el`: its path up to the nearest unique #id,
 * leaving out steps that don't narrow it.
 */
export const getUniqueSelector = (el: HTMLElement): string | null => {
  const steps: Array<string> = [];

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const id = getStableIdBasedSelector(node);
    const step = id && countMatches(id) === 1 ? id : getDistinguishedStep(node);

    steps.unshift(step);

    if (countMatches(steps.join(' ')) === 1) {
      return dropRedundantSteps(steps).join(' ');
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

    if (getLookAlikes(ancestor).rivals.length > 0) {
      const item = getUniqueSelector(ancestor);
      return item ? `${item} ${subject}` : null;
    }

    ancestor = ancestor.parentElement;
  }

  return null;
};
