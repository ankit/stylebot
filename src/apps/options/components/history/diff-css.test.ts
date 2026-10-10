import { diffCss } from './diff-css';

const css = (...lines: Array<string>): string => lines.join('\n');

describe('diffCss', () => {
  it('shows a changed declaration inside its rule', () => {
    const before = css(
      'a {',
      '  color: red;',
      '}',
      '',
      '.titleline {',
      '  font-size: 13px;',
      '}'
    );
    const after = css(
      'a {',
      '  color: red;',
      '}',
      '',
      '.titleline {',
      '  font-size: 15px;',
      '}'
    );

    expect(diffCss(before, after)).toEqual({
      lines: [
        { sign: ' ', text: '.titleline {' },
        { sign: '-', text: '  font-size: 13px;' },
        { sign: '+', text: '  font-size: 15px;' },
        { sign: ' ', text: '}' },
      ],
      added: 1,
      removed: 1,
    });
  });

  it('keeps changes in neighboring rules together', () => {
    const before = css('a {', '  color: red;', '}', 'b {', '  margin: 0;', '}');
    const after = css(
      'a {',
      '  color: blue;',
      '}',
      'b {',
      '  margin: 1px;',
      '}'
    );

    const { lines } = diffCss(before, after);

    expect(lines).toHaveLength(8);
    expect(lines.includes(null)).toBe(false);
    expect(lines.filter(line => line?.sign === '+')).toHaveLength(2);
  });

  it('collapses unchanged rules between changes', () => {
    const before = css(
      'a {',
      '  color: red;',
      '}',
      'b {',
      '  x: 1;',
      '}',
      'c {',
      '  margin: 0;',
      '}'
    );
    const after = css(
      'a {',
      '  color: blue;',
      '}',
      'b {',
      '  x: 1;',
      '}',
      'c {',
      '  margin: 1px;',
      '}'
    );

    expect(diffCss(before, after).lines).toContain(null);
  });

  it('counts a new style as all added', () => {
    expect(diffCss(null, css('a {', '  color: red;', '}'))).toMatchObject({
      added: 3,
      removed: 0,
    });
  });

  it('counts a deleted style as all removed', () => {
    expect(diffCss(css('a {', '}'), null)).toMatchObject({
      added: 0,
      removed: 2,
    });
  });
});
