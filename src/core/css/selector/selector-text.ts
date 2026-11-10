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
