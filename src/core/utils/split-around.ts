export type TextPart = { text: string; match: boolean };

/**
 * Splits text around the first occurrence of part, so that part can be set
 * apart, such as in mono. Empty pieces are dropped.
 */
export const splitAround = (text: string, part: string): Array<TextPart> => {
  const index = part ? text.indexOf(part) : -1;

  if (index === -1) {
    return [{ text, match: false }];
  }

  return [
    { text: text.slice(0, index), match: false },
    { text: part, match: true },
    { text: text.slice(index + part.length), match: false },
  ].filter(piece => piece.text);
};
