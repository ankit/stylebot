import { splitCompounds } from './compounds';

const texts = (selector: string) =>
  splitCompounds(selector).map(({ combinator, text }) => combinator + text);

describe('splitCompounds', () => {
  it('splits on descendant and child combinators, normalising their spaces', () => {
    expect(texts('nav>ul  a.link')).toEqual(['nav', ' > ul', ' a.link']);
  });

  it('keeps brackets and parens whole', () => {
    expect(texts('a[title="a b"] li:is(.x, .y)')).toEqual([
      'a[title="a b"]',
      ' li:is(.x, .y)',
    ]);
  });

  it("keeps a hex escape's trailing space inside the compound", () => {
    expect(texts('#\\34 9953495 span > a')).toEqual([
      '#\\34 9953495',
      ' span',
      ' > a',
    ]);
  });
});
