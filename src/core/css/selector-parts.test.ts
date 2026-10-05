import { splitSelectorParts } from './selector-parts';

describe('splitSelectorParts', () => {
  it('splits at combinators, keeping each one with the compound after it', () => {
    expect(splitSelectorParts('nav > ul  a')).toEqual(['nav', ' > ul', '  a']);
    expect(splitSelectorParts('h1+p~span')).toEqual(['h1', '+p', '~span']);
  });

  it('splits a compound at each id, class, attribute and pseudo-class', () => {
    expect(splitSelectorParts('a#top.link[href]:hover::before')).toEqual([
      'a',
      '#top',
      '.link',
      '[href]',
      ':hover',
      '::before',
    ]);
  });

  it('keeps brackets and parens whole', () => {
    expect(splitSelectorParts('a[title="a.b c"] li:is(.x, .y)')).toEqual([
      'a',
      '[title="a.b c"]',
      ' li',
      ':is(.x, .y)',
    ]);
  });

  it("keeps a hex escape's trailing space inside its part", () => {
    expect(splitSelectorParts('#\\34 9953495 span > a')).toEqual([
      '#\\34 9953495',
      ' span',
      ' > a',
    ]);
  });

  it("doesn't split on an escaped character", () => {
    expect(splitSelectorParts('.nav .a\\.b')).toEqual(['.nav', ' .a\\.b']);
  });
});
