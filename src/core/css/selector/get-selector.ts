import { looksHashedByShape } from '../hashed-class';
import { countMatches, matchesOf } from './reach';
import {
  classSelector,
  getClassBasedSelector,
  getClassNames,
  getDescriptiveSelector,
  getIdBasedSelector,
  getLabelBasedSelector,
  getNameBasedSelector,
  getNonHashedClassBasedSelector,
  getStableIdBasedSelector,
  getTestIdBasedSelector,
} from './element-selectors';
import {
  climbToNearestUsableAncestor,
  getAncestorHashedClassSelector,
  getAncestorScopeWithinOwnClass,
  getTagNameBasedSelector,
  unlessSweeping,
} from './ancestor-selectors';
import { getUniqueSelector } from './alternatives';

/**
 * The element's #id in place of its own class when at most half of the
 * other elements with that class have ids.
 */
const getIdOverSharedClass = (el: HTMLElement): string | null => {
  const id = getStableIdBasedSelector(el);
  const ownClass = getNonHashedClassBasedSelector(el);
  if (!id || !ownClass || countMatches(id) !== 1) {
    return null;
  }

  const others = matchesOf(ownClass).filter(match => match !== el);
  const othersWithIds = others.filter(
    match => match instanceof HTMLElement && getStableIdBasedSelector(match)
  );
  if (others.length === 0 || othersWithIds.length > others.length / 2) {
    return null;
  }

  return id;
};

/**
 * The most stable selector for the element that doesn't sweep the page.
 * See docs/selectors.md.
 */
export const getSelector = (el: HTMLElement): string =>
  getIdOverSharedClass(el) ??
  getDescriptiveSelector(el) ??
  unlessSweeping(getAncestorScopeWithinOwnClass(el)) ??
  getStableIdBasedSelector(el) ??
  getLabelBasedSelector(el) ??
  getClassBasedSelector(el) ??
  unlessSweeping(getAncestorHashedClassSelector(el)) ??
  unlessSweeping(getTagNameBasedSelector(el)) ??
  getUniqueSelector(el) ??
  getTagNameBasedSelector(el);

/**
 * The selector a body child got before partly hashed classes, newer hash
 * shapes and the sweeping check, since page-wide effects saved against it
 * are found again by its exact text.
 */
const getLegacyBodyChildSelector = (el: HTMLElement): string => {
  const getOwnName = (node: HTMLElement) =>
    classSelector(
      node,
      getClassNames(node).find(name => !looksHashedByShape(name))
    ) ??
    getTestIdBasedSelector(node) ??
    getNameBasedSelector(node);

  return (
    getOwnName(el) ??
    climbToNearestUsableAncestor(el, getOwnName) ??
    getIdBasedSelector(el) ??
    getClassBasedSelector(el) ??
    getAncestorHashedClassSelector(el) ??
    getTagNameBasedSelector(el)
  );
};

/**
 * Selectors for body's rendered children (not scripts, styles or the
 * editor's own host) — the elements page-wide effects attach to.
 */
export const getBodyChildSelectors = (): Array<string> => {
  const el = document.querySelector('body');
  const nodes: Array<HTMLElement> = Array.prototype.slice.call(el?.childNodes);

  const filteredNodes = nodes.filter(node => {
    if (!node.tagName) {
      return false;
    }

    const tagName = node.tagName.toLowerCase();

    if (
      tagName === 'script' ||
      tagName === 'style' ||
      tagName === 'noscript' ||
      node.id === 'stylebot'
    ) {
      return false;
    }

    return true;
  });

  return filteredNodes.map(getLegacyBodyChildSelector);
};
