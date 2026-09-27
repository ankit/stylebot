const COMBINATORS = ['>', '+', '~'];
const BRACKET_DEPTH_CHANGE: Record<string, number> = {
  '[': 1,
  '(': 1,
  ']': -1,
  ')': -1,
};

type SubjectScan = {
  subject: string;
  depth: number;
  escaped: boolean;
};

const isCombinator = (char: string): boolean =>
  char.trim() === '' || COMBINATORS.includes(char);

/**
 * Adds one character to the subject being read, or starts a new subject on
 * an unescaped combinator outside brackets and parens.
 */
const readSubjectChar = (scan: SubjectScan, char: string): SubjectScan => {
  if (scan.escaped) {
    return { ...scan, subject: scan.subject + char, escaped: false };
  }

  if (scan.depth === 0 && isCombinator(char)) {
    return { ...scan, subject: '' };
  }

  return {
    subject: scan.subject + char,
    depth: scan.depth + (BRACKET_DEPTH_CHANGE[char] ?? 0),
    escaped: char === '\\',
  };
};

/**
 * The rightmost compound of a selector — the part naming the element it
 * styles, e.g. `a.link` in `nav > ul a.link`.
 */
export const getSubjectCompound = (selector: string): string =>
  Array.from(selector).reduce(readSubjectChar, {
    subject: '',
    depth: 0,
    escaped: false,
  }).subject;
