export type LineRange = {
  start: number;
  end: number;
};

const HEADER_START = /^\s*\/\*\s*==Stylebot==/;

/**
 * The `==Stylebot==` metadata comment when it opens the css, as a 1-based
 * line range.
 */
export const getHeaderRange = (css: string): LineRange | null => {
  const lines = css.split('\n');
  const start = lines.findIndex(line => line.trim() !== '');

  if (start === -1 || !HEADER_START.test(lines[start])) {
    return null;
  }

  const end = lines.findIndex(
    (line, index) => index >= start && line.includes('*/')
  );

  if (end <= start) {
    return null;
  }

  return { start: start + 1, end: end + 1 };
};

/**
 * The metadata comment's text, to tell when it changed.
 */
export const getHeaderText = (css: string): string => {
  const range = getHeaderRange(css);

  if (!range) {
    return '';
  }

  return css
    .split('\n')
    .slice(range.start - 1, range.end)
    .join('\n');
};

/**
 * The span of `before` that has to be replaced to get `after`, leaving the
 * shared start and end alone so folds there survive.
 */
export const getChangedSpan = (
  before: string,
  after: string
): { start: number; end: number; text: string } => {
  const maxLength = Math.min(before.length, after.length);
  let prefix = 0;

  while (prefix < maxLength && before[prefix] === after[prefix]) {
    prefix++;
  }

  let suffix = 0;

  while (
    suffix < maxLength - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix++;
  }

  return {
    start: prefix,
    end: before.length - suffix,
    text: after.slice(prefix, after.length - suffix),
  };
};
