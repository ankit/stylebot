export type Segment = { text: string; subject: boolean };

const segment = (text: string, subject = false): Segment => ({
  text: text.trim(),
  subject,
});

/**
 * Splits a translated sentence around the subject it names, so the two can be
 * styled apart while the locale keeps its own word order.
 */
export const splitAround = (
  sentence: string,
  subject: string
): Array<Segment> => {
  const [before, ...after] = subject ? sentence.split(subject) : [sentence];

  if (after.length === 0) {
    return [segment(sentence)];
  }

  return [
    segment(before),
    segment(subject, true),
    segment(after.join(subject)),
  ].filter(({ text }) => text !== '');
};
