const COMBINATOR = /[\s>+~]/;

// A backslash and what it escapes: up to 6 hex digits and one space, or a
// single character.
const ESCAPE = /^\\([0-9a-f]{1,6}\s?|[\s\S])/i;

/**
 * Splits a selector where each compound starts, keeping the combinator
 * before it, e.g. `nav > ul a` into `nav`, ` > ul` and ` a`. Brackets,
 * parens and escapes are never split.
 */
export const splitCompounds = (selector: string): Array<string> => {
  const parts: Array<string> = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (char === '\\') {
      i += (selector.slice(i).match(ESCAPE)?.[0].length ?? 1) - 1;
    } else if (char === '[' || char === '(') {
      depth++;
    } else if (char === ']' || char === ')') {
      depth--;
    } else if (
      depth === 0 &&
      COMBINATOR.test(char) &&
      !COMBINATOR.test(selector[i - 1])
    ) {
      parts.push(selector.slice(start, i));
      start = i;
    }
  }

  return [...parts, selector.slice(start)];
};
