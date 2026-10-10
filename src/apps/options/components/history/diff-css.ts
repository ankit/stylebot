export type DiffLine = {
  sign: '+' | '-' | ' ';
  text: string;
};

export type CssDiff = {
  // Changed lines with the rule around them; null marks lines left out.
  lines: Array<DiffLine | null>;
  added: number;
  removed: number;
};

/**
 * Past this many cells the middle of two stylesheets is shown as replaced
 * outright rather than matched line by line.
 */
const MAX_CELLS = 4_000_000;

/**
 * How far a change reaches for the selector above it and the brace below.
 */
const MAX_CONTEXT = 6;

const toLines = (css: string | null): Array<string> =>
  css ? css.replace(/\s+$/, '').split('\n') : [];

/**
 * The lines of `after` against `before` in order, each kept, added or removed,
 * by their longest common run. Shared ends are matched first, since an edit
 * usually touches a few lines in the middle.
 */
const diffLines = (
  before: Array<string>,
  after: Array<string>
): Array<DiffLine> => {
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start += 1;
  }

  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end += 1;
  }

  const a = before.slice(start, before.length - end);
  const b = after.slice(start, after.length - end);
  const middle: Array<DiffLine> = [];

  if (a.length * b.length > MAX_CELLS) {
    a.forEach(text => middle.push({ sign: '-', text }));
    b.forEach(text => middle.push({ sign: '+', text }));
  } else {
    const width = b.length + 1;
    const lcs = new Uint32Array((a.length + 1) * width);

    for (let i = a.length - 1; i >= 0; i -= 1) {
      for (let j = b.length - 1; j >= 0; j -= 1) {
        lcs[i * width + j] =
          a[i] === b[j]
            ? lcs[(i + 1) * width + j + 1] + 1
            : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }

    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        middle.push({ sign: ' ', text: a[i] });
        i += 1;
        j += 1;
      } else if (
        i < a.length &&
        (j === b.length || lcs[(i + 1) * width + j] >= lcs[i * width + j + 1])
      ) {
        middle.push({ sign: '-', text: a[i] });
        i += 1;
      } else {
        middle.push({ sign: '+', text: b[j] });
        j += 1;
      }
    }
  }

  return [
    ...before.slice(0, start).map(text => ({ sign: ' ' as const, text })),
    ...middle,
    ...before
      .slice(before.length - end)
      .map(text => ({ sign: ' ' as const, text })),
  ];
};

/**
 * What a site's css change did, as the changed lines inside the rules that
 * hold them: each change reaches up to its selector and down to its brace.
 */
export const diffCss = (
  before: string | null,
  after: string | null
): CssDiff => {
  const all = diffLines(toLines(before), toLines(after));
  const shown = all.map(line => line.sign !== ' ');

  all.forEach((line, index) => {
    if (line.sign === ' ') {
      return;
    }

    for (let up = index - 1; up >= Math.max(0, index - MAX_CONTEXT); up -= 1) {
      shown[up] = true;
      if (all[up].text.includes('{')) {
        break;
      }
    }

    const last = Math.min(all.length - 1, index + MAX_CONTEXT);
    for (let down = index + 1; down <= last; down += 1) {
      shown[down] = true;
      if (all[down].text.includes('}')) {
        break;
      }
    }
  });

  const lines: CssDiff['lines'] = [];
  all.forEach((line, index) => {
    if (shown[index]) {
      lines.push(line);
    } else if (lines.length && lines[lines.length - 1] !== null) {
      lines.push(null);
    }
  });

  if (lines[lines.length - 1] === null) {
    lines.pop();
  }

  return {
    lines,
    added: all.filter(line => line.sign === '+').length,
    removed: all.filter(line => line.sign === '-').length,
  };
};
