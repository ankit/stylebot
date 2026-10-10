export type SentencePart = { text: string; pill: boolean };

// An invisible separator, which no translation or profile name holds.
const MARK = '⁣';

/**
 * A translated sentence cut around the values it fills in, so they can be
 * styled apart while each locale keeps its own word order.
 */
export const splitSentence = (
  translate: (substitutions: Array<string>) => string,
  values: Array<string>
): Array<SentencePart> => {
  const sentence = translate(
    values.map((_, index) => `${MARK}${index}${MARK}`)
  );

  return sentence
    .split(new RegExp(`${MARK}(\\d+)${MARK}`))
    .map((text, index) =>
      index % 2
        ? { text: values[Number(text)], pill: true }
        : { text: text.trim(), pill: false }
    )
    .filter(({ text, pill }) => pill || text !== '');
};
