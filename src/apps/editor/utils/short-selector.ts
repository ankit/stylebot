import { splitCompounds, splitSelectorList } from '@stylebot/css';

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
 * One selector cut to `maxChars` by dropping whole compounds from its
 * middle, keeping the first and as many of the last as fit.
 */
const dropMiddleCompounds = (
  selector: string,
  maxChars: number
): Array<SelectorPiece> => {
  const compounds = splitCompounds(selector);
  const lastOf = (count: number) =>
    compounds.slice(-count).join('').trimStart();

  if (selector.length <= maxChars || compounds.length < 3) {
    return [{ text: selector }];
  }

  const first = compounds[0];
  let keep = compounds.length - 2;

  while (
    keep > 1 &&
    first.length + ELLIPSIS_CHARS + lastOf(keep).length > maxChars
  ) {
    keep--;
  }

  return [
    { text: first },
    { text: '…', kind: 'ellipsis' },
    { text: lastOf(keep) },
  ];
};

/**
 * `selector` as pieces to show within `maxChars`: whole when it fits, else
 * a list's first member with a count of the rest, its middle compounds
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
    return { pieces: dropMiddleCompounds(parts[0], maxChars), more: 0 };
  }

  const more = parts.length - 1;
  return {
    pieces: dropMiddleCompounds(parts[0], maxChars - ` +${more}`.length - 1),
    more,
  };
};
