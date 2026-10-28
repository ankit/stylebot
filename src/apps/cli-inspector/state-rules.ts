/*
 * Copies of a page's :hover, :active and :focus rules keyed to an attribute
 * instead, so the CLI can force those states without a real pointer or focus.
 * Adapted from storybook-addon-pseudo-states (MIT), which rewrites rules the
 * same way for Storybook's pseudo-state toolbar.
 */
import * as postcss from 'postcss';

import { splitSelectorList } from '@stylebot/css';
import type { PseudoState } from '@stylebot/types';

export const PSEUDO_STATES: ReadonlyArray<PseudoState> = [
  'hover',
  'active',
  'focus',
  'focus-visible',
  'focus-within',
];

export const FORCE_ATTRIBUTE = 'data-stylebot-force';

// Longest first, so :focus doesn't take the start of :focus-visible.
const STATE = /^:(hover|active|focus-visible|focus-within|focus)(?![\w-])/i;

/**
 * The attribute selector standing in for a state, with the same specificity
 * as the pseudo-class it replaces.
 */
export const getStateMarker = (state: PseudoState): string =>
  `[${FORCE_ATTRIBUTE}~="${state}"]`;

/**
 * Skips past a quoted string or an attribute selector starting at i, which
 * can hold a colon that isn't a pseudo-class.
 */
const skipToken = (selector: string, i: number): number => {
  const close = selector[i] === '[' ? ']' : selector[i];
  let j = i + 1;

  while (j < selector.length && selector[j] !== close) {
    if (selector[j] === '\\') {
      j++;
    } else if (close === ']' && (selector[j] === '"' || selector[j] === "'")) {
      j = skipToken(selector, j);
    }

    j++;
  }

  return j;
};

/**
 * One complex selector with each state pseudo-class swapped for its marker,
 * or null when it has none.
 */
const rewriteSelector = (selector: string): string | null => {
  let result = '';
  let changed = false;
  let i = 0;

  while (i < selector.length) {
    const char = selector[i];

    if (char === '\\') {
      result += selector.slice(i, i + 2);
      i += 2;
    } else if (char === '"' || char === "'" || char === '[') {
      const end = skipToken(selector, i) + 1;
      result += selector.slice(i, end);
      i = end;
    } else if (char === ':' && selector[i + 1] === ':') {
      result += '::';
      i += 2;
    } else if (char === ':' && STATE.test(selector.slice(i))) {
      const [match, state] = STATE.exec(selector.slice(i)) as RegExpExecArray;
      result += getStateMarker(state.toLowerCase() as PseudoState);
      changed = true;
      i += match.length;
    } else {
      result += char;
      i++;
    }
  }

  return changed ? result : null;
};

/**
 * A selector list's selectors that name a state, rewritten, or all of them
 * inside a rule that already did. Null when none would be kept.
 */
export const rewriteSelectorList = (
  selectorList: string,
  keepAll = false
): string | null => {
  const kept = splitSelectorList(selectorList).flatMap(selector => {
    const rewritten = rewriteSelector(selector.trim());

    if (rewritten) {
      return [rewritten];
    }

    return keepAll ? [selector.trim()] : [];
  });

  return kept.length ? kept.join(', ') : null;
};

const URL_VALUE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

/**
 * A declaration value with its relative url()s resolved against the sheet
 * it came from, since the copy lives in another one.
 */
const rebaseUrls = (value: string, baseUrl: string): string =>
  value.replace(URL_VALUE, (whole, quote: string, url: string) => {
    if (/^(?:[a-z][\w+.-]*:|#)/i.test(url)) {
      return whole;
    }

    try {
      return `url(${quote}${new URL(url, baseUrl).href}${quote})`;
    } catch {
      return whole;
    }
  });

/**
 * Copies into `to` what of `from` applies in a forced state: rules naming a
 * state, the declarations and rules nested in them, and the at-rules and
 * parent rules around them, without the parents' own declarations.
 */
const copyStateNodes = (
  from: postcss.Container,
  to: postcss.Container,
  inState: boolean,
  baseUrl: string | undefined
): void => {
  from.each(node => {
    if (node.type === 'decl') {
      if (inState) {
        to.append(
          node.clone({
            value: baseUrl ? rebaseUrls(node.value, baseUrl) : node.value,
          })
        );
      }
    } else if (node.type === 'rule') {
      const selector = rewriteSelectorList(node.selector, inState);
      const copy = node.clone({ selector: selector ?? node.selector });

      copy.removeAll();
      copyStateNodes(node, copy, selector !== null, baseUrl);

      if (selector !== null || copy.first) {
        to.append(copy);
      }
    } else if (node.type === 'atrule' && node.nodes) {
      const copy = node.clone();

      copy.removeAll();
      copyStateNodes(node, copy, inState, baseUrl);

      if (copy.first) {
        to.append(copy);
      }
    }
  });
};

/**
 * The rules of a stylesheet's css that apply in a forced state, rewritten to
 * the state's marker attribute inside the same at-rules, with the same
 * specificity and `!important`s. Relative urls resolve against baseUrl.
 */
export const copyStateRules = (css: string, baseUrl?: string): string => {
  let root: postcss.Root;

  try {
    root = postcss.parse(css);
  } catch {
    return '';
  }

  const copy = postcss.root();
  copyStateNodes(root, copy, false, baseUrl);

  return copy.first ? copy.toString() : '';
};
