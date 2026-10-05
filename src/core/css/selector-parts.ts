const COMBINATOR = /[\s>+~]/;
const SIMPLE_SELECTOR_START = /[.#[:]/;

// A backslash and what it escapes: up to 6 hex digits and one space, or a
// single character.
const ESCAPE = /^\\([0-9a-f]{1,6}\s?|[\s\S])/i;

/**
 * Splits a selector where each of its parts starts: each id, class,
 * attribute or pseudo-class, and each compound with the combinator before
 * it, e.g. `nav > a.link` into `nav`, ` > a` and `.link`. Brackets, parens
 * and escapes are never split.
 */
export const splitSelectorParts = (selector: string): Array<string> => {
  const parts: Array<string> = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    const previous = selector[i - 1] ?? ' ';

    if (char === '\\') {
      i += (selector.slice(i).match(ESCAPE)?.[0].length ?? 1) - 1;
      continue;
    }

    const startsPart =
      (COMBINATOR.test(char) && !COMBINATOR.test(previous)) ||
      (SIMPLE_SELECTOR_START.test(char) &&
        !COMBINATOR.test(previous) &&
        previous !== ':');

    if (depth === 0 && startsPart) {
      parts.push(selector.slice(start, i));
      start = i;
    }

    if (char === '[' || char === '(') {
      depth++;
    } else if (char === ']' || char === ')') {
      depth--;
    }
  }

  return [...parts, selector.slice(start)];
};
