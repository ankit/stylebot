export type MarkdownInline =
  | { type: 'text' | 'code'; text: string }
  | { type: 'strong' | 'em'; children: Array<MarkdownInline> };

export type MarkdownLine = Array<MarkdownInline>;

export type MarkdownBlock =
  | { type: 'paragraph'; lines: Array<MarkdownLine> }
  | { type: 'heading'; line: MarkdownLine }
  | {
      type: 'list';
      ordered: boolean;
      start: number;
      items: Array<MarkdownLine>;
    }
  | { type: 'code'; text: string };

const FENCE = /^\s*```/;
const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const CONTINUATION = /^\s{2,}\S/;

/*
 * Code spans, **strong**, *em* and _em_ (only at word edges, so snake_case
 * stays text), and links, which keep their text and drop the URL.
 */
const INLINE =
  /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*(?=\S)([\s\S]*?\S)\*\*|\*(?=[^\s*])([\s\S]*?[^\s*])\*|(?<!\w)_(?=\S)([\s\S]*?\S)_(?!\w)|\[([^\]]+)\]\([^)\s]*\)/g;

/**
 * Splits a line into text, code, strong and em runs, strong and em holding
 * runs of their own. Markers left open, as they are while a reply streams
 * in, stay as text.
 */
export const parseInline = (text: string): MarkdownLine => {
  const runs: MarkdownLine = [];
  let last = 0;

  const push = (type: 'text' | 'code', value: string) => {
    const previous = runs[runs.length - 1];

    if (type === 'text' && previous?.type === 'text') {
      previous.text += value;
    } else if (value) {
      runs.push({ type, text: value });
    }
  };

  for (const match of text.matchAll(INLINE)) {
    const [whole, , code, strong, star, underscore, link] = match;
    const index = match.index ?? 0;

    push('text', text.slice(last, index));

    if (code !== undefined) {
      push('code', code.trim() ? code.replace(/^ (.*) $/, '$1') : code);
    } else if (strong !== undefined) {
      runs.push({ type: 'strong', children: parseInline(strong) });
    } else if (star !== undefined || underscore !== undefined) {
      runs.push({ type: 'em', children: parseInline(star ?? underscore) });
    } else {
      push('text', link ?? whole);
    }

    last = index + whole.length;
  }

  push('text', text.slice(last));

  return runs;
};

type Draft =
  | { type: 'paragraph'; lines: Array<string> }
  | { type: 'heading'; text: string }
  | { type: 'list'; ordered: boolean; start: number; items: Array<string> }
  | { type: 'code'; lines: Array<string>; open: boolean };

/**
 * Parses a reply's markdown into paragraphs, headings, flat lists and code
 * blocks. Anything else reads as paragraph text, and a code block still
 * open at the end, as it is mid-stream, runs to the end.
 */
export const parseMarkdown = (source: string): Array<MarkdownBlock> => {
  const drafts: Array<Draft> = [];
  // Whether the next line can join the last block rather than start one.
  let joinable = false;
  const last = (): Draft | undefined => drafts[drafts.length - 1];

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const block = last();

    if (block?.type === 'code' && block.open) {
      if (FENCE.test(line)) {
        block.open = false;
      } else {
        block.lines.push(line);
      }

      continue;
    }

    const heading = HEADING.exec(line);
    const listItem = NUMBERED.exec(line) ?? BULLET.exec(line);
    const ordered = NUMBERED.test(line);

    if (FENCE.test(line)) {
      drafts.push({ type: 'code', lines: [], open: true });
      joinable = false;
    } else if (!line.trim()) {
      joinable = false;
    } else if (heading) {
      drafts.push({ type: 'heading', text: heading[1].trim() });
      joinable = false;
    } else if (listItem) {
      const text = listItem[listItem.length - 1].trim();

      if (joinable && block?.type === 'list' && block.ordered === ordered) {
        block.items.push(text);
      } else {
        drafts.push({
          type: 'list',
          ordered,
          start: ordered ? Number(listItem[1]) : 1,
          items: [text],
        });
      }

      joinable = true;
    } else if (joinable && block?.type === 'list' && CONTINUATION.test(line)) {
      block.items[block.items.length - 1] += ` ${line.trim()}`;
    } else if (joinable && block?.type === 'paragraph') {
      block.lines.push(line.trim());
    } else {
      drafts.push({ type: 'paragraph', lines: [line.trim()] });
      joinable = true;
    }
  }

  return drafts.map((draft): MarkdownBlock => {
    switch (draft.type) {
      case 'paragraph':
        return { type: 'paragraph', lines: draft.lines.map(parseInline) };
      case 'heading':
        return { type: 'heading', line: parseInline(draft.text) };
      case 'list':
        return { ...draft, items: draft.items.map(parseInline) };
      default:
        return { type: 'code', text: draft.lines.join('\n') };
    }
  });
};
