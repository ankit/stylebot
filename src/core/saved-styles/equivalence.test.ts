import type { StyleWithoutUrl } from '@stylebot/types';

import { isEquivalentStyleMap } from './equivalence';

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

describe('isEquivalentStyleMap with profiles', () => {
  const plain = style('a { color: red; }');
  const materialized = style('a { color: red; }', T1, {
    profiles: { default: { name: '' } },
    activeProfile: 'default',
  });
  const two = style('a { color: red; }', T1, {
    profiles: { default: { name: '' }, dark: { name: 'Dark', css: 'b {}' } },
    activeProfile: 'default',
  });

  it('treats a style without profiles as its lone default profile', () => {
    expect(
      isEquivalentStyleMap({ 'a.com': plain }, { 'a.com': materialized })
    ).toBe(true);
  });

  it('ignores which profile is applied when asked to', () => {
    const switched = style('b {}', T1, {
      profiles: {
        default: { name: '', css: 'a { color: red; }' },
        dark: { name: 'Dark' },
      },
      activeProfile: 'dark',
    });

    expect(
      isEquivalentStyleMap(
        { 'a.com': two },
        { 'a.com': switched },
        { ignoreActiveProfile: true }
      )
    ).toBe(true);
  });

  it('tells apart a switch, a rename and an edit to an inactive profile', () => {
    const switched = style('b {}', T1, {
      profiles: {
        default: { name: '', css: 'a { color: red; }' },
        dark: { name: 'Dark' },
      },
      activeProfile: 'dark',
    });
    const renamed = style('a { color: red; }', T1, {
      profiles: { default: { name: '' }, dark: { name: 'Night', css: 'b {}' } },
      activeProfile: 'default',
    });
    const edited = style('a { color: red; }', T1, {
      profiles: { default: { name: '' }, dark: { name: 'Dark', css: 'c {}' } },
      activeProfile: 'default',
    });

    for (const other of [switched, renamed, edited, plain]) {
      expect(isEquivalentStyleMap({ 'a.com': two }, { 'a.com': other })).toBe(
        false
      );
    }
  });
});
