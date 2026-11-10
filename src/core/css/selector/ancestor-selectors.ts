import { getSubjectCompound } from '../get-subject-compound';
import { looksMinified } from '../hashed-class';
import { countMatches } from './reach';
import {
  classSelector,
  getClassBasedSelector,
  getClassNames,
  getDescriptiveSelector,
} from './element-selectors';

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
 * Like getTagNameBasedSelector, but stops at the nearest ancestor (within
 * 2 levels) with a real class/test-id/name, e.g. `div.mw-heading h2`.
 */
export const getAncestorBasedSelector = (el: HTMLElement): string | null =>
  climbToNearestUsableAncestor(el, getDescriptiveSelector);

/**
 * The ancestor scope, unless it reaches more of the page than the element's
 * own minified class, as `div.ieodic div` does next to Google's `div.VwiC3b`.
 */
export function getAncestorScopeWithinOwnClass(el: HTMLElement): string | null {
  const scope = getAncestorBasedSelector(el);
  const [firstClass] = getClassNames(el);
  const own =
    firstClass && looksMinified(firstClass)
      ? classSelector(el, firstClass)
      : null;

  return scope && own && countMatches(scope) > countMatches(own) ? null : scope;
}

/**
 * The same climb as getAncestorBasedSelector, but accepting a hashed
 * class too — only reached once nothing better is available anywhere.
 */
export function getAncestorHashedClassSelector(el: HTMLElement): string | null {
  return climbToNearestUsableAncestor(el, getClassBasedSelector);
}

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

export const unlessSweeping = (selector: string | null): string | null =>
  selector && !isSweeping(selector) ? selector : null;

/**
 * Scopes `el` by each of its nearest ancestors (up to 4 levels) that has a
 * class, test id or name of its own, e.g. `td.subtext a`: each is a step
 * wider or narrower than the others. The element keeps its own class if
 * it has one (`td.title span.sitestr`), since its bare tag says little.
 */
export const getAncestorScopedSelectors = (el: HTMLElement): Array<string> => {
  const subject = getDescriptiveSelector(el) ?? el.tagName.toLowerCase();
  const selectors: Array<string> = [];
  let ancestor = el.parentElement;

  for (let level = 0; ancestor && level < 4; level++) {
    const own =
      getDescriptiveSelector(ancestor) ?? getClassBasedSelector(ancestor);

    if (own) {
      selectors.push(`${own} ${subject}`);
    }

    ancestor = ancestor.parentElement;
  }

  return selectors;
};
