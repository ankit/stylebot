import type { StyleWithoutUrl } from '@stylebot/types';

import { isEquivalentStyleMap } from '../equivalence';

const T1 = '2024-01-01T00:00:00.000Z';
const T2 = '2024-02-01T00:00:00.000Z';

const style = (
  css: string,
  modifiedTime = T1,
  rest: Partial<StyleWithoutUrl> = {}
): StyleWithoutUrl => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime,
  ...rest,
});

describe('isEquivalentStyleMap', () => {
  it('ignores modifiedTime and whitespace', () => {
    expect(
      isEquivalentStyleMap(
        { 'a.com': style('a { color: red; }') },
        { 'a.com': style('a {\n  color: red;\n}\n', T2) }
      )
    ).toBe(true);
  });

  it('tells apart added urls and changed flags or css', () => {
    const a = { 'a.com': style('a { color: red; }') };

    expect(isEquivalentStyleMap(a, {})).toBe(false);
    expect(isEquivalentStyleMap({}, a)).toBe(false);
    expect(
      isEquivalentStyleMap(a, { 'b.com': style('a { color: red; }') })
    ).toBe(false);
    expect(
      isEquivalentStyleMap(a, {
        'a.com': style('a { color: red; }', T1, { enabled: false }),
      })
    ).toBe(false);
    expect(
      isEquivalentStyleMap(a, {
        'a.com': style('a { color: red; }', T1, { readability: true }),
      })
    ).toBe(false);
    expect(
      isEquivalentStyleMap(a, { 'a.com': style('a { color: blue; }') })
    ).toBe(false);
  });
});
