export type FontValueToken = {
  start: number;
  end: number;
  value: string;
};

/**
 * Strips the quotes around a family name: `"Fira Code"` gives `Fira Code`.
 */
export const unquoteFamily = (family: string): string =>
  family.replace(/^["']|["']$/g, '');

/**
 * Quotes a family name for a font-family value when it has spaces.
 */
export const quoteFamily = (family: string): string =>
  family.includes(' ') ? `"${family}"` : family;

/**
 * Finds the comma-separated segment of a font-family value that contains the
 * caret. `start`/`end` bound the raw segment (commas excluded); `value` is
 * the family name inside it, trimmed and unquoted.
 */
export const getTokenAtCaret = (
  text: string,
  caretIndex: number
): FontValueToken => {
  const caret = Math.max(0, Math.min(caretIndex, text.length));
  const start = text.lastIndexOf(',', caret - 1) + 1;
  const nextComma = text.indexOf(',', caret);
  const end = nextComma === -1 ? text.length : nextComma;

  return { start, end, value: unquoteFamily(text.slice(start, end).trim()) };
};

/**
 * Replaces a segment found by getTokenAtCaret with a family name, keeping
 * the rest of the stack and the space after the preceding comma intact.
 * The name is quoted only when it joins other families in a stack.
 */
export const replaceToken = (
  text: string,
  token: FontValueToken,
  family: string
): string => {
  const segment = text.slice(token.start, token.end);
  const leading = segment.match(/^\s*/)?.[0] ?? '';
  const spacing = token.start > 0 && !leading ? ' ' : leading;
  const name = text.includes(',') ? quoteFamily(family) : family;

  return `${text.slice(0, token.start)}${spacing}${name}${text.slice(
    token.end
  )}`;
};

/**
 * The first family of a font-family value, trimmed and unquoted:
 * `"Playfair Display", serif` gives `Playfair Display`.
 */
export const getPrimaryFontFamily = (value: string): string =>
  getTokenAtCaret(value, 0).value;
