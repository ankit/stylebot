const SKIPPED_TAGS = new Set([
  'script',
  'style',
  'svg',
  'noscript',
  'link',
  'meta',
  'template',
]);

// Stylebot mounts its own editor UI in a shadow root under this host —
// exclude it so the panel doesn't describe itself to the model.
const SKIPPED_IDS = new Set(['stylebot']);

const MAX_DEPTH = 12;
const MAX_NODES = 600;
const MAX_TEXT_LENGTH = 40;
const MAX_OUTPUT_LENGTH = 12000;
const MIN_REPEATS_TO_COLLAPSE = 3;
const MAX_PATTERN_PERIOD = 4;

const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.classList.length
    ? `.${Array.from(el.classList).join('.')}`
    : '';
  const role = el.getAttribute('role');

  return `${tag}${id}${classes}${role ? `[role=${role}]` : ''}`;
};

// A shallow fingerprint (own tag/class plus each direct child's tag/class)
// used to detect repeating siblings. Deliberately excludes id — ids are
// unique per element (e.g. Hacker News story rows), so including it would
// mean no two "same shape" rows ever compare equal. Includes one level of
// children so e.g. a header <tr> and a content <tr> with no classes of
// their own aren't mistaken for the same shape.
const shapeKey = (el: Element): string => {
  const own = `${el.tagName}.${Array.from(el.classList).sort().join('.')}`;
  const childShapes = Array.from(el.children)
    .map(c => `${c.tagName}.${Array.from(c.classList).sort().join('.')}`)
    .join('|');

  return `${own}>>${childShapes}`;
};

// Finds the longest run starting at `start` that repeats with some period
// 1..MAX_PATTERN_PERIOD (e.g. a 3-row [story, subtext, spacer] group on
// Hacker News). Returns null if nothing repeats often enough to bother.
const findRepeatingRun = (
  keys: string[],
  start: number
): { period: number; repeats: number } | null => {
  let best: { period: number; repeats: number } | null = null;

  for (let period = 1; period <= MAX_PATTERN_PERIOD; period++) {
    let repeats = 1;

    while (true) {
      const blockStart = start + repeats * period;
      const blockEnd = blockStart + period;
      if (blockEnd > keys.length) break;

      let matches = true;
      for (let i = 0; i < period; i++) {
        if (keys[start + i] !== keys[blockStart + i]) {
          matches = false;
          break;
        }
      }
      if (!matches) break;
      repeats++;
    }

    if (repeats >= MIN_REPEATS_TO_COLLAPSE) {
      if (!best || repeats * period > best.repeats * best.period) {
        best = { period, repeats };
      }
    }
  }

  return best;
};

type Counter = { count: number };

const pruneChildren = (
  el: Element,
  depth: number,
  lines: string[],
  indent: string,
  counter: Counter
): void => {
  const children = Array.from(el.children).filter(
    c => !SKIPPED_TAGS.has(c.tagName.toLowerCase()) && !SKIPPED_IDS.has(c.id)
  );

  if (depth >= MAX_DEPTH || children.length === 0) {
    return;
  }

  const keys = children.map(shapeKey);
  let i = 0;

  while (i < children.length) {
    if (counter.count >= MAX_NODES) {
      lines.push(`${indent}⋯ truncated (node budget reached)`);
      return;
    }

    const run = findRepeatingRun(keys, i);

    if (run) {
      const shownBlocks = 1;
      for (let b = 0; b < shownBlocks; b++) {
        for (let k = 0; k < run.period; k++) {
          renderNode(children[i + b * run.period + k], depth, lines, indent, counter);
        }
      }

      const remaining = run.repeats - shownBlocks;
      const sample = children[i];
      const sampleShape = `${sample.tagName.toLowerCase()}${
        sample.classList.length ? `.${Array.from(sample.classList).join('.')}` : ''
      }`;
      const noun = run.period > 1 ? `group${remaining > 1 ? 's' : ''} of ${run.period}` : '';
      lines.push(
        `${indent}⋯ ${remaining} more ${noun}${noun ? ' ' : ''}<${sampleShape}> sibling${
          remaining > 1 ? 's' : ''
        } (same shape)`
      );

      i += run.repeats * run.period;
    } else {
      renderNode(children[i], depth, lines, indent, counter);
      i += 1;
    }
  }
};

const renderNode = (
  el: Element,
  depth: number,
  lines: string[],
  indent: string,
  counter: Counter
): void => {
  counter.count += 1;

  let label = describeElement(el);

  if (el.children.length === 0) {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (text) {
      label += ` "${text.slice(0, MAX_TEXT_LENGTH)}${
        text.length > MAX_TEXT_LENGTH ? '…' : ''
      }"`;
    }
  }

  lines.push(indent + label);
  pruneChildren(el, depth + 1, lines, indent + '  ', counter);
};

// Produces a compact, structure-only outline of the page (tag/id/class/role,
// short leaf text, repeated siblings collapsed) to give the CSS-generation
// model enough context to write real selectors, without shipping the full
// HTML/attributes/scripts — which are irrelevant, bulky, and sometimes
// carry sensitive query params (e.g. auth tokens in href values).
export const getDomSnapshot = (): string => {
  const lines: string[] = [];
  const counter: Counter = { count: 0 };

  lines.push(describeElement(document.body));
  pruneChildren(document.body, 1, lines, '  ', counter);

  let output = lines.join('\n');
  if (output.length > MAX_OUTPUT_LENGTH) {
    output = output.slice(0, MAX_OUTPUT_LENGTH) + '\n⋯ truncated (size budget reached)';
  }

  return output;
};
