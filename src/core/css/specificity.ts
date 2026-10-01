import { splitSelectorList } from './selector';

export type Specificity = [number, number, number, number];

const SPECIFICITY_OF_ARGUMENT = ['is', 'not', 'has', 'matches', 'any'];
const LEGACY_PSEUDO_ELEMENTS = [
  'before',
  'after',
  'first-line',
  'first-letter',
];

const isIdentChar = (ch: string): boolean =>
  /[\w-]/.test(ch) || ch.charCodeAt(0) > 0x7f;

const skipIdent = (s: string, i: number): number => {
  while (i < s.length) {
    if (s[i] === '\\') {
      i += 2;
    } else if (isIdentChar(s[i])) {
      i++;
    } else {
      break;
    }
  }

  return i;
};

/**
 * Returns the index just past the bracket or paren that opens at `i`,
 * skipping nested pairs and quoted strings.
 */
const skipGroup = (s: string, i: number): number => {
  let depth = 0;
  let quote: string | null = null;

  for (; i < s.length; i++) {
    const ch = s[i];

    if (ch === '\\') {
      i++;
    } else if (quote) {
      if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth++;
    } else if (ch === ')' || ch === ']') {
      depth--;

      if (depth === 0) {
        return i + 1;
      }
    }
  }

  return s.length;
};

/**
 * Orders two specificities: negative when `a` is lower, positive when
 * higher, 0 when equal.
 */
export const compareSpecificity = (a: Specificity, b: Specificity): number => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }

  return 0;
};

const maxSpecificity = (list: string): Specificity =>
  splitSelectorList(list)
    .map(getSpecificity)
    .reduce<Specificity>(
      (max, s) => (compareSpecificity(s, max) > 0 ? s : max),
      [0, 0, 0, 0]
    );

/**
 * The specificity of a single complex selector, as [inline, ids, classes,
 * types]. :is/:not/:has count their most specific argument, :where nothing.
 */
export const getSpecificity = (selector: string): Specificity => {
  const result: Specificity = [0, 0, 0, 0];
  let i = 0;

  const add = (s: Specificity) => {
    result[1] += s[1];
    result[2] += s[2];
    result[3] += s[3];
  };

  while (i < selector.length) {
    const ch = selector[i];

    if (ch === '\\') {
      result[3]++;
      i = skipIdent(selector, i);
    } else if (ch === '#') {
      result[1]++;
      i = skipIdent(selector, i + 1);
    } else if (ch === '.') {
      result[2]++;
      i = skipIdent(selector, i + 1);
    } else if (ch === '[') {
      result[2]++;
      i = skipGroup(selector, i);
    } else if (ch === ':' && selector[i + 1] === ':') {
      result[3]++;
      i = skipIdent(selector, i + 2);

      if (selector[i] === '(') {
        i = skipGroup(selector, i);
      }
    } else if (ch === ':') {
      const start = i + 1;
      i = skipIdent(selector, start);
      const name = selector
        .slice(start, i)
        .toLowerCase()
        .replace(/^-\w+-/, '');
      let args: string | null = null;

      if (selector[i] === '(') {
        const end = skipGroup(selector, i);
        args = selector.slice(i + 1, end - 1);
        i = end;
      }

      if (name === 'where') {
        continue;
      } else if (args !== null && SPECIFICITY_OF_ARGUMENT.includes(name)) {
        add(maxSpecificity(args));
      } else if (LEGACY_PSEUDO_ELEMENTS.includes(name)) {
        result[3]++;
      } else {
        result[2]++;
      }
    } else if (isIdentChar(ch)) {
      result[3]++;
      i = skipIdent(selector, i);
    } else {
      i++;
    }
  }

  return result;
};
