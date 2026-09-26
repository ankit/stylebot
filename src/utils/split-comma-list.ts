const CLOSERS: Record<string, string> = { '(': ')', '[': ']' };

/**
 * The trimmed members of a comma-separated list, ignoring commas inside
 * quotes, parentheses and brackets, e.g. `[style*='rgb(1, 2, 3)'], a`.
 */
export const splitCommaList = (value: string): Array<string> => {
  const parts: Array<string> = [];
  const closers: Array<string> = [];
  let quote: string | null = null;
  let start = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === '\\') {
      i++;
    } else if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (CLOSERS[char]) {
      closers.push(CLOSERS[char]);
    } else if (char === closers[closers.length - 1]) {
      closers.pop();
    } else if (char === ',' && !closers.length) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(value.slice(start));
  return parts.map(part => part.trim()).filter(Boolean);
};
