import { splitSelectorList, splitSelectorParts } from '@stylebot/css';

export type SelectorPiece = {
  text: string;
  kind?: 'separator' | 'ellipsis';
};

export type ShortSelector = {
  pieces: Array<SelectorPiece>;
  // How many members of a selector list were left out.
  more: number;
};

// The ellipsis chip takes about three characters' room with its margins.
const ELLIPSIS_CHARS = 3;

const length = (pieces: Array<SelectorPiece>) =>
  pieces.reduce((total, piece) => total + piece.text.length, 0);

/**
 * One selector cut to `maxChars` by dropping whole parts from its middle,
 * keeping the first and as many of the last as fit; the dropped ones show
 * as an ellipsis, at the end when no last part fits.
 */
const dropMiddleParts = (
  selector: string,
  maxChars: number
): Array<SelectorPiece> => {
  const parts = splitSelectorParts(selector);

  if (selector.length <= maxChars || parts.length < 2) {
    return [{ text: selector }];
  }

  const [first] = parts;
  const lastOf = (count: number) =>
    count ? parts.slice(-count).join('').trimStart() : '';
  let keep = parts.length - 2;

  while (
    keep > 0 &&
    first.length + ELLIPSIS_CHARS + lastOf(keep).length > maxChars
  ) {
    keep--;
  }

  return [
    { text: first },
    { text: '…', kind: 'ellipsis' },
    ...(keep ? [{ text: lastOf(keep) }] : []),
  ];
};

/**
 * `selector` as pieces to show within `maxChars`: whole when it fits, else
 * a list's first member with a count of the rest, its middle parts
 * dropped for an ellipsis when still too long.
 */
export const shortenSelector = (
  selector: string,
  maxChars: number
): ShortSelector => {
  const parts = splitSelectorList(selector);
  const pieces = parts.flatMap(
    (part, i): Array<SelectorPiece> =>
      i === 0
        ? [{ text: part }]
        : [{ text: ', ', kind: 'separator' }, { text: part }]
  );

  if (length(pieces) <= maxChars) {
    return { pieces, more: 0 };
  }

  if (parts.length === 1) {
    return { pieces: dropMiddleParts(parts[0], maxChars), more: 0 };
  }

  const more = parts.length - 1;
  return {
    pieces: dropMiddleParts(parts[0], maxChars - ` +${more}`.length - 1),
    more,
  };
};
