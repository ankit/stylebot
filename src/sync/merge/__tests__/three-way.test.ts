import { StyleMap, StyleWithoutUrl } from '@stylebot/types';

import { mergeThreeWay, isEquivalentStyleMap } from '../three-way';

const AT = '2026-09-18T11:04:22.331Z';
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

const X = style('a { color: red; }');
const X1 = style('a { color: blue; }', T2);
const X2 = style('a { color: green; }', T2);

const merge = (base: StyleMap | undefined, local: StyleMap, remote: StyleMap) =>
  mergeThreeWay(base, local, remote, AT);

describe('mergeThreeWay', () => {
  it('keeps a style nobody touched', () => {
    const map = { 'a.com': X };

    expect(merge(map, map, map)).toEqual({ styles: map, conflicts: [] });
  });

  it('takes the remote edit when only remote changed', () => {
    expect(merge({ 'a.com': X }, { 'a.com': X }, { 'a.com': X1 })).toEqual({
      styles: { 'a.com': X1 },
      conflicts: [],
    });
  });

  it('takes the local edit when only local changed', () => {
    expect(merge({ 'a.com': X }, { 'a.com': X1 }, { 'a.com': X })).toEqual({
      styles: { 'a.com': X1 },
      conflicts: [],
    });
  });

  it('keeps one copy when both sides made the same edit', () => {
    expect(merge({ 'a.com': X }, { 'a.com': X1 }, { 'a.com': X1 })).toEqual({
      styles: { 'a.com': X1 },
      conflicts: [],
    });
  });

  it('merges the css when both sides edited different lines', () => {
    const base = style('body {\n  color: #333;\n}\n\na {\n  color: #06c;\n}');
    const local = style(
      'body {\n  color: #333;\n}\n\na {\n  color: #0a7;\n}',
      T2
    );
    const remote = style(
      'body {\n  color: #333;\n  font-size: 18px;\n}\n\na {\n  color: #06c;\n}',
      T1
    );

    expect(
      merge({ 'a.com': base }, { 'a.com': local }, { 'a.com': remote })
    ).toEqual({
      styles: {
        'a.com': style(
          'body {\n  color: #333;\n  font-size: 18px;\n}\n\na {\n  color: #0a7;\n}',
          T2
        ),
      },
      conflicts: [],
    });
  });

  it('flags the url when both sides rewrote the same lines', () => {
    const { styles, conflicts } = merge(
      { 'a.com': X },
      { 'a.com': X1 },
      { 'a.com': X2 }
    );

    expect(conflicts).toEqual(['a.com']);
    expect(styles['a.com'].css).toContain('a { color: blue; }');
    expect(styles['a.com'].css).toContain(
      'another device had\na { color: green; }'
    );
  });

  it('gives the flags of the newer edit when both sides changed', () => {
    const local = style('a { color: blue; }', T1, { enabled: false });
    const remote = style('a { color: green; }', T2, { readability: true });

    const { styles } = merge(
      { 'a.com': X },
      { 'a.com': local },
      { 'a.com': remote }
    );

    expect(styles['a.com']).toMatchObject({
      enabled: true,
      readability: true,
      modifiedTime: T2,
    });
    expect(styles['a.com'].css).toContain('a { color: green; }\n\n/*');
  });

  it('takes a change to Override site styles made on one side', () => {
    const unforced = style(X.css, T2, { forceImportant: false });

    expect(
      merge({ 'a.com': X }, { 'a.com': X }, { 'a.com': unforced })
    ).toEqual({ styles: { 'a.com': unforced }, conflicts: [] });
  });

  it("gives the newer edit's Override site styles setting when both sides changed", () => {
    const local = style('a { color: blue; }', T1);
    const remote = style('a { color: green; }', T2, { forceImportant: false });

    const { styles } = merge(
      { 'a.com': X },
      { 'a.com': local },
      { 'a.com': remote }
    );

    expect(styles['a.com'].forceImportant).toBe(false);
  });

  it('deletes a style local removed', () => {
    expect(merge({ 'a.com': X }, {}, { 'a.com': X })).toEqual({
      styles: {},
      conflicts: [],
    });
  });

  it('deletes a style remote removed', () => {
    expect(merge({ 'a.com': X }, { 'a.com': X }, {})).toEqual({
      styles: {},
      conflicts: [],
    });
  });

  it('stays deleted when both sides removed the same style', () => {
    expect(merge({ 'a.com': X }, {}, {})).toEqual({
      styles: {},
      conflicts: [],
    });
  });

  it('keeps an edit over a deletion, on either side', () => {
    expect(merge({ 'a.com': X }, { 'a.com': X1 }, {})).toEqual({
      styles: { 'a.com': X1 },
      conflicts: [],
    });
    expect(merge({ 'a.com': X }, {}, { 'a.com': X1 })).toEqual({
      styles: { 'a.com': X1 },
      conflicts: [],
    });
  });

  it('keeps a style added on one side only', () => {
    expect(merge({}, { 'a.com': X }, {})).toEqual({
      styles: { 'a.com': X },
      conflicts: [],
    });
    expect(merge({}, {}, { 'a.com': X })).toEqual({
      styles: { 'a.com': X },
      conflicts: [],
    });
  });

  it('merges a style added independently on both sides', () => {
    const { styles, conflicts } = merge({}, { 'a.com': X1 }, { 'a.com': X2 });

    expect(conflicts).toEqual(['a.com']);
    expect(styles['a.com'].css).toContain('a { color: blue; }');
    expect(styles['a.com'].css).toContain('a { color: green; }');
  });

  it('does not treat a reformat as an edit', () => {
    const reformatted = style('a {\n    color: red;\n}\n\n', T2);

    expect(
      merge({ 'a.com': X }, { 'a.com': reformatted }, { 'a.com': X1 })
    ).toEqual({ styles: { 'a.com': X1 }, conflicts: [] });
  });

  it('ignores modifiedTime when deciding whether a side changed', () => {
    const restamped = { ...X, modifiedTime: T2 };

    expect(
      merge({ 'a.com': X }, { 'a.com': restamped }, { 'a.com': X1 })
    ).toEqual({ styles: { 'a.com': X1 }, conflicts: [] });
  });

  it('falls back to the newest-wins union when there is no base', () => {
    expect(
      merge(undefined, { 'a.com': X, 'b.com': X }, { 'a.com': X1, 'c.com': X })
    ).toEqual({
      styles: { 'a.com': X1, 'b.com': X, 'c.com': X },
      conflicts: [],
    });
  });
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
