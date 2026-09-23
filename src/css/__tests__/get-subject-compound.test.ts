import { getSubjectCompound } from '../get-subject-compound';

describe('getSubjectCompound', () => {
  it('returns a selector with no combinators as is', () => {
    expect(getSubjectCompound('a.link')).toBe('a.link');
  });

  it('returns the part after the last descendant or child combinator', () => {
    expect(getSubjectCompound('nav > ul a.link')).toBe('a.link');
  });

  it('splits on sibling combinators', () => {
    expect(getSubjectCompound('h1 + p')).toBe('p');
    expect(getSubjectCompound('h1 ~ p.lede')).toBe('p.lede');
  });

  it('splits on a newline and indentation', () => {
    expect(getSubjectCompound('.card\n  .title')).toBe('.title');
  });

  it("doesn't split on a space inside an attribute selector", () => {
    expect(getSubjectCompound('.nav a[title="a b"]')).toBe('a[title="a b"]');
  });

  it("doesn't split on a combinator inside parens", () => {
    expect(getSubjectCompound('li:nth-child(2n + 1)')).toBe(
      'li:nth-child(2n + 1)'
    );
    expect(getSubjectCompound('.nav li:is(.x, .y) a')).toBe('a');
  });

  it("doesn't split on an escaped combinator", () => {
    expect(getSubjectCompound('.nav .a\\+b')).toBe('.a\\+b');
  });

  it("doesn't count escaped brackets towards nesting", () => {
    expect(getSubjectCompound('.top-\\[10px\\] > span')).toBe('span');
  });
});
