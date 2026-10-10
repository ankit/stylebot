import { splitSentence } from './sentence-parts';

const fill = (sentence: string) => (substitutions: Array<string>) =>
  substitutions.reduce(
    (text, value, index) => text.replace(`$${index + 1}`, value),
    sentence
  );

describe('splitSentence', () => {
  it('cuts a sentence around the values it names', () => {
    expect(splitSentence(fill('Renamed $1 to $2'), ['Night', 'to'])).toEqual([
      { text: 'Renamed', pill: false },
      { text: 'Night', pill: true },
      { text: 'to', pill: false },
      { text: 'to', pill: true },
    ]);
  });

  it('keeps a word order that puts the values first', () => {
    expect(splitSentence(fill('$2 から $1'), ['A', 'B'])).toEqual([
      { text: 'B', pill: true },
      { text: 'から', pill: false },
      { text: 'A', pill: true },
    ]);
  });
});
