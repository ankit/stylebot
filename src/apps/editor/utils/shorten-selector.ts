import { splitSelectorList } from '@stylebot/css';

export type SelectorPiece = {
  text: string;
  kind?: 'separator' | 'ellipsis';
};

export type ShortSelector = {
  pieces: Array<SelectorPiece>;
  // How many members of a selector list were left out.
  more: number;
};

// Where each id, class, attribute, pseudo-class or combinator starts, but
// not inside an escape like `#\34 2`.
const PART_START =
  /(?<![\s>+~]|\\[0-9a-f]{1,6})(?=[\s>+~])|(?<![\s>+~:\\])(?=[.#[:])/i;

// The ellipsis chip takes about five characters' room with its margins.
const ELLIPSIS_CHARS = 5;
const ELLIPSIS: SelectorPiece = { text: '⋯', kind: 'ellipsis' };

/**
 * One selector cut to `maxChars`: its first part, an ellipsis for the
 * parts dropped, then the longest run of its last parts that fits.
 */
const dropMiddleParts = (
  selector: string,
  maxChars: number
): Array<SelectorPiece> => {
  const [first, ...rest] = selector.split(PART_START);

  for (let i = 1; i < rest.length; i++) {
    const tail = rest.slice(i).join('').trimStart();

    if (first.length + ELLIPSIS_CHARS + tail.length <= maxChars) {
      return [{ text: first }, ELLIPSIS, { text: tail }];
    }
  }

  return rest.length ? [{ text: first }, ELLIPSIS] : [{ text: selector }];
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
  const members = splitSelectorList(selector);

  if (members.join(', ').length <= maxChars) {
    return {
      pieces: members.flatMap(
        (member, i): Array<SelectorPiece> =>
          i
            ? [{ text: ', ', kind: 'separator' }, { text: member }]
            : [{ text: member }]
      ),
      more: 0,
    };
  }

  const more = members.length - 1;
  const room = more ? maxChars - ` +${more}`.length - 1 : maxChars;

  return {
    pieces:
      members[0].length <= room
        ? [{ text: members[0] }]
        : dropMiddleParts(members[0], room),
    more,
  };
};
