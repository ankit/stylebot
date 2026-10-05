import { splitCompounds } from './compounds';

describe('splitCompounds', () => {
  it('splits where each compound starts, keeping its combinator', () => {
    expect(splitCompounds('nav > ul  a.link')).toEqual([
      'nav',
      ' > ul',
      '  a.link',
    ]);
    expect(splitCompounds('h1+p~span')).toEqual(['h1', '+p', '~span']);
  });

  it('keeps brackets and parens whole', () => {
    expect(splitCompounds('a[title="a b"] li:is(.x, .y)')).toEqual([
      'a[title="a b"]',
      ' li:is(.x, .y)',
    ]);
  });

  it("keeps a hex escape's trailing space inside its compound", () => {
    expect(splitCompounds('#\\34 9953495 span > a')).toEqual([
      '#\\34 9953495',
      ' span',
      ' > a',
    ]);
  });

  it("doesn't split on an escaped combinator", () => {
    expect(splitCompounds('.nav .a\\+b')).toEqual(['.nav', ' .a\\+b']);
  });
});
