import { compareSpecificity, getSpecificity } from './specificity';

describe('getSpecificity', () => {
  it.each([
    ['td', [0, 0, 0, 1]],
    ['tr.athing > td.title', [0, 0, 2, 2]],
    ['#main a:hover', [0, 1, 1, 1]],
    ['a[href^="x,y"]::before', [0, 0, 1, 2]],
    [':is(#a, .b) p', [0, 1, 0, 1]],
    [':where(#a) p', [0, 0, 0, 1]],
    ['*', [0, 0, 0, 0]],
  ])('%s', (selector, expected) => {
    expect(getSpecificity(selector)).toEqual(expected);
  });
});

describe('compareSpecificity', () => {
  it('ranks ids over classes over types', () => {
    expect(compareSpecificity([0, 1, 0, 0], [0, 0, 9, 9])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 0, 1, 0], [0, 0, 0, 9])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 0, 0, 1], [0, 0, 1, 0])).toBeLessThan(0);
  });

  it('is 0 for equal specificities', () => {
    expect(compareSpecificity([0, 1, 2, 3], [0, 1, 2, 3])).toBe(0);
  });
});
