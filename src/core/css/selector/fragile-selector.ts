import type { FragileSelector } from '@stylebot/types';

import { looksHashed, looksMinified } from '../hashed-class';
import { getStableClassMatcher } from './element-selectors';

/**
 * `selector` with each class swapped for what `replace` returns, or kept
 * when it returns null. Classes inside quoted attribute values are skipped.
 */
const replaceClasses = (
  selector: string,
  replace: (className: string) => string | null
): string => {
  let result = '';
  let quote: string | null = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (quote) {
      result += char;
      if (char === '\\') {
        result += selector[++i] ?? '';
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '\\') {
      result += char + (selector[++i] ?? '');
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      continue;
    }

    const token =
      char === '.' && selector.slice(i + 1).match(/^(?:\\.|[\w-])+/);
    if (!token) {
      result += char;
      continue;
    }

    const className = token[0].replace(/\\(.)/g, '$1');
    result += replace(className) ?? `.${token[0]}`;
    i += token[0].length;
  }

  return result;
};

/**
 * `selector` with each partly hashed class swapped for its stable matcher,
 * e.g. `nav .Header_nav__a1B2c a` → `nav [class*="Header_nav__"] a`. Classes
 * inside quoted attribute values are left alone.
 */
export const getStableSelector = (selector: string): string =>
  replaceClasses(selector, className => getStableClassMatcher(className));

/**
 * The selector's generated class names, which change when the site rebuilds,
 * with a version that matches the partly generated ones by their stable
 * parts; null when it has none. Minified names, kept across releases, pass.
 */
export const getFragileSelector = (
  selector: string
): FragileSelector | null => {
  const hashed: Array<string> = [];

  replaceClasses(selector, className => {
    if (looksHashed(className) && !looksMinified(className)) {
      hashed.push(className);
    }

    return null;
  });

  if (!hashed.length) {
    return null;
  }

  const stable = getStableSelector(selector);

  return {
    selector,
    stable: stable === selector ? null : stable,
    unstable: hashed.filter(className => !getStableClassMatcher(className)),
  };
};
