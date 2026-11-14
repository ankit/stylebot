import { looksHashedByShape } from '../hashed-class';
import {
  classSelector,
  getClassBasedSelector,
  getClassNames,
  getIdBasedSelector,
  getIdOverSharedClass,
  getLabelBasedSelector,
  getNameBasedSelector,
  getSharedTestIdSelector,
  getStableClassPartsSelector,
  getStableClassSelector,
  getStableIdBasedSelector,
  getTestIdBasedSelector,
} from './element-selectors';
import {
  climbToNearestUsableAncestor,
  getAncestorBasedSelector,
  getAncestorHashedClassSelector,
  getTagNameBasedSelector,
  isSweeping,
} from './ancestor-selectors';
import { getItemScopedSelector, getUniqueSelector } from './unique-selectors';
import {
  getHookScopedSelector,
  getNamedScopeSelector,
  getSameSpotSelector,
  getTagInScopeSelector,
} from './similar-selectors';
import { describeSelector } from './describe-selector';
import type { SelectorDescription, SelectorRole } from './describe-selector';

type Strategy = (el: HTMLElement) => string | null;

/**
 * A strategy and the scope pill its selectors are offered for, if any.
 */
type ScopedStrategy = {
  strategy: Strategy;
  role?: Exclude<SelectorRole, 'only'>;
  fallback?: boolean;
};

type Suggestion = {
  selector: string;
  description?: SelectorDescription;
};

/**
 * Every way to name an element, most stable first: its own name, an
 * ancestor's, its id or label, a generated class, then this one element
 * alone. See docs/selectors.md.
 */
const STRATEGIES: Array<Strategy> = [
  getIdOverSharedClass,
  getSharedTestIdSelector,
  getStableClassSelector,
  getNameBasedSelector,
  getStableClassPartsSelector,
  getAncestorBasedSelector,
  getStableIdBasedSelector,
  getLabelBasedSelector,
  getClassBasedSelector,
  getAncestorHashedClassSelector,
  getUniqueSelector,
];

/**
 * Whether a selector matches `el` without sweeping the page.
 */
const isUsable = (
  el: HTMLElement,
  selector: string | null
): selector is string => {
  try {
    return (
      Boolean(selector) &&
      el.matches(selector as string) &&
      !isSweeping(selector as string)
    );
  } catch {
    return false;
  }
};

/**
 * The first selector in the list that suits the element.
 */
export const getSelector = (el: HTMLElement): string => {
  for (const strategy of STRATEGIES) {
    const selector = strategy(el);
    if (isUsable(el, selector)) {
      return selector;
    }
  }

  return el.tagName.toLowerCase();
};

/**
 * Every selector in the list that suits the element, plus the scoped
 * ones, each described by how much it covers for the scope pills.
 */
export const getSelectorSuggestions = (el: HTMLElement): Array<Suggestion> => {
  const scopedStrategies: Array<ScopedStrategy> = [
    ...STRATEGIES.map(strategy => ({ strategy, role: 'all' as const })),
    { strategy: getSameSpotSelector, role: 'similar' },
    { strategy: getHookScopedSelector, role: 'similar' },
    { strategy: getItemScopedSelector },
    { strategy: getNamedScopeSelector, role: 'similar', fallback: true },
    { strategy: getTagInScopeSelector, role: 'all', fallback: true },
  ];

  return scopedStrategies.flatMap(({ strategy, role, fallback }) => {
    const selector = strategy(el);
    if (!isUsable(el, selector)) {
      return [];
    }

    const description = role
      ? describeSelector(selector, role, fallback)
      : undefined;

    return [{ selector, description }];
  });
};

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
