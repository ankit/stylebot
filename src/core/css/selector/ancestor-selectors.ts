import { getSubjectCompound } from '../get-subject-compound';
import { countMatches } from './reach';
import { getClassBasedSelector, getOwnNameSelector } from './element-selectors';

export const getTagNameBasedSelector = (
  el: HTMLElement,
  domHeirarchyLevel = 0
): string => {
  const tagName = el.tagName.toLowerCase();

  // don't go beyond 2 levels up the DOM
  if (domHeirarchyLevel < 2 && el.parentElement) {
    const parent = el.parentElement;
    const parentSelector = getTagNameBasedSelector(
      parent,
      domHeirarchyLevel + 1
    );

    return `${parentSelector} ${tagName}`;
  }

  return tagName;
};

/**
 * Climbs up to 2 levels, stopping at the first ancestor getOwnSelector
 * likes, instead of always reaching a fixed depth.
 */
export function climbToNearestUsableAncestor(
  el: HTMLElement,
  getOwnSelector: (el: HTMLElement) => string | null
): string | null {
  const tagChain: Array<string> = [el.tagName.toLowerCase()];
  let current = el;

  for (let level = 0; level < 2; level++) {
    const parent = current.parentElement;
    if (!parent) {
      return null;
    }

    const parentSelector = getOwnSelector(parent);
    if (parentSelector) {
      return [parentSelector, ...tagChain].join(' ');
    }

    tagChain.unshift(parent.tagName.toLowerCase());
    current = parent;
  }

  return null;
}

/**
 * The element's tag scoped by its nearest ancestor (within 2 levels) that
 * carries a name, e.g. `div.mw-heading h2`.
 */
export const getAncestorBasedSelector = (el: HTMLElement): string | null =>
  climbToNearestUsableAncestor(el, getOwnNameSelector);

/**
 * The same climb, scoping by an ancestor's first class even when hashed.
 */
export const getAncestorHashedClassSelector = (
  el: HTMLElement
): string | null => climbToNearestUsableAncestor(el, getClassBasedSelector);

// Generic containers, whose "most of them" means most of the page; matching
// most of a page's links or dates is a real choice.
const CONTAINER_TAGS = new Set(['div', 'span']);

// Below this many matches, a selector is still a choice, not the whole page.
const MIN_SWEEP = 50;

/**
 * Whether a scoped selector ending in a bare container, like
 * `div.app div div`, matches most of the page's elements of that tag, so
 * it's effectively the bare tag and would restyle nearly the whole page.
 */
export const isSweeping = (selector: string): boolean => {
  const subject = getSubjectCompound(selector);
  if (subject === selector || !CONTAINER_TAGS.has(subject.toLowerCase())) {
    return false;
  }

  const matches = countMatches(selector);
  return matches >= MIN_SWEEP && matches > countMatches(subject) / 2;
};
