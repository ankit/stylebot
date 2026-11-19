import { getChangedSpan, getHeaderRange, getHeaderText } from './header-fold';

const HEADER = [
  '/* ==Stylebot==',
  '@var select theme "Theme" {}',
  '==/Stylebot== */',
];

describe('getHeaderRange', () => {
  it('finds the metadata comment that opens the css', () => {
    expect(getHeaderRange(['', ...HEADER, 'a {}'].join('\n'))).toEqual({
      start: 2,
      end: 4,
    });
  });

  it('ignores other leading comments', () => {
    expect(getHeaderRange('/* notes\n */\na {}')).toBeNull();
  });

  it('ignores a header on one line, which has nothing to fold', () => {
    expect(getHeaderRange('/* ==Stylebot== ==/Stylebot== */')).toBeNull();
  });
});

describe('getHeaderText', () => {
  it('ignores changes to the rules below', () => {
    const css = [...HEADER, 'a {}'].join('\n');

    expect(getHeaderText(`${css}\nb {}`)).toBe(getHeaderText(css));
    expect(getHeaderText(css.replace('Theme', 'Mode'))).not.toBe(
      getHeaderText(css)
    );
  });
});

describe('getChangedSpan', () => {
  it('covers only the part that differs', () => {
    expect(getChangedSpan('a { color: red; }', 'a { color: blue; }')).toEqual({
      start: 11,
      end: 14,
      text: 'blue',
    });
  });

  it("doesn't let the shared start and end overlap", () => {
    expect(getChangedSpan('aa', 'aaa')).toEqual({
      start: 2,
      end: 2,
      text: 'a',
    });
    expect(getChangedSpan('aaa', 'aa')).toEqual({ start: 2, end: 3, text: '' });
  });
});
