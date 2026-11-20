import { METADATA_BLOCKS } from './style-options';

const KEY = '@force-important';
const KEY_LINE = /^@force-important\s+(\S+)$/;
const KEY_LINES = /^[ \t]*\*?[ \t]*@force-important\b.*(?:\r?\n|$)/gm;
const OPENING_LINE = /==(?:Stylebot|UserStyle)==[^\n]*\n?/;
const EMPTY_BLOCK =
  /^\/\*[\s*]*==(Stylebot|UserStyle)==[\s*]*==\/\1==[\s*]*\*\/$/;
const NEW_BLOCK = `/* ==Stylebot==\n${KEY} false\n==/Stylebot== */\n\n`;

/**
 * Whether a stylesheet wants `!important` forced onto its declarations: true
 * unless its metadata block says `@force-important false`.
 */
export const isForceImportantCss = (css: string): boolean => {
  if (!css.includes(KEY)) {
    return true;
  }

  for (const block of css.matchAll(METADATA_BLOCKS)) {
    for (const raw of block[2].split('\n')) {
      const line = raw.replace(/^\s*\*?\s*/, '').trim();
      const value = line.match(KEY_LINE)?.[1];

      if (value === 'false' || value === 'true') {
        return value === 'true';
      }

      if (line.startsWith(KEY)) {
        console.warn(`Stylebot: ignoring "${line}" (expected true or false)`);
      }
    }
  }

  return true;
};

const BLOCKS_WITH_BLANK_LINES = new RegExp(
  `${METADATA_BLOCKS.source}\\n*`,
  'g'
);

/**
 * Removes every `@force-important` line from the metadata blocks, and any
 * block that leaves empty along with the blank lines after it.
 */
const removeKeyLines = (css: string): string =>
  css.replace(BLOCKS_WITH_BLANK_LINES, match => {
    if (!match.includes(KEY)) {
      return match;
    }

    const blankLines = (match.match(/\n*$/) as RegExpMatchArray)[0];
    const rest = match
      .slice(0, match.length - blankLines.length)
      .replace(KEY_LINES, '');

    return EMPTY_BLOCK.test(rest) ? '' : rest + blankLines;
  });

/**
 * Returns the stylesheet with `@force-important false` in its metadata block
 * when force is false, or without the line when true, since true is the
 * default. A block is added at the top when there's none to write into.
 */
export const setForceImportantCss = (css: string, force: boolean): string => {
  const stripped = removeKeyLines(css);

  if (force) {
    return stripped;
  }

  const block = stripped.match(new RegExp(METADATA_BLOCKS.source));

  if (block?.index === undefined) {
    return NEW_BLOCK + stripped;
  }

  const opening = block[0].match(OPENING_LINE) as RegExpMatchArray;
  const afterOpening = (opening.index ?? 0) + opening[0].length;
  const next = block[0].slice(afterOpening);
  const prefix = next.match(/^([ \t]*\*?[ \t]*)\S/)?.[1] ?? '';
  const newline = opening[0].endsWith('\n') ? '' : '\n';
  const updated =
    block[0].slice(0, afterOpening) +
    `${newline}${prefix}${KEY} false\n` +
    next;

  return (
    stripped.slice(0, block.index) +
    updated +
    stripped.slice(block.index + block[0].length)
  );
};
