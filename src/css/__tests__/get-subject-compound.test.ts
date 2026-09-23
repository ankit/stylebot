import { getSubjectCompound } from '../get-subject-compound';

describe('getSubjectCompound', () => {
  it.each([
    ['a.link', 'a.link'],
    ['nav > ul a.link', 'a.link'],
    ['h1 + p', 'p'],
    ['h1 ~ p.lede', 'p.lede'],
    ['.card\n  .title', '.title'],
    ['.nav a[title="a b"]', 'a[title="a b"]'],
    ['li:nth-child(2n + 1)', 'li:nth-child(2n + 1)'],
    ['.nav li:is(.x, .y) a', 'a'],
    ['.nav .a\\+b', '.a\\+b'],
    ['.top-\\[10px\\] > span', 'span'],
  ])('reads the subject of %j as %j', (selector, subject) => {
    expect(getSubjectCompound(selector)).toBe(subject);
  });
});
