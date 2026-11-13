import { splitCommaList } from '@stylebot/utils';

/**
 * An id or class name escaped for use in a selector, so a Tailwind class
 * like `lg:-mt-16` becomes `lg\:-mt-16`.
 */
export const escapeSelectorToken = (value: string): string => {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }

  // Fallback escape for special characters when CSS.escape is unavailable
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
};

/**
 * A value quoted in a CSS string, with control characters such as
 * newlines written as hex escapes, which CSS strings can't hold raw.
 */
export function escapeAttributeValue(value: string): string {
  return value.replace(/[\\"]/g, '\\$&').replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f]/g,
    char => `\\${char.charCodeAt(0).toString(16)} `
  );
}

/**
 * The members of a comma-separated selector list, trimmed.
 */
export const splitSelectorList = (selector: string): Array<string> =>
  splitCommaList(selector);

/**
 * How many compound steps a selector chains, e.g. 3 for `#menu li > a`,
 * not counting what sits inside brackets, parentheses or quotes.
 */
export const countSelectorSteps = (selector: string): number => {
  let steps = 0;
  let depth = 0;
  let quote = '';
  let inStep = false;

  for (const char of selector) {
    if (quote) {
      quote = char === quote ? '' : quote;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth--;
    }

    const separates = !quote && depth === 0 && /[\s>+~]/.test(char);

    if (separates) {
      inStep = false;
    } else if (!inStep) {
      inStep = true;
      steps++;
    }
  }

  return steps;
};

// Beyond this many steps a selector is too tied to the page's structure to
// keep working as the site changes.
const MAX_SIMPLE_STEPS = 3;

/**
 * Whether a selector is simple enough to last: a few steps and no position.
 */
export const isSimpleSelector = (selector: string): boolean =>
  countSelectorSteps(selector) <= MAX_SIMPLE_STEPS &&
  !selector.includes(':nth-of-type(');

export const validateSelector = (selector: string): boolean => {
  if (!selector) {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
};
