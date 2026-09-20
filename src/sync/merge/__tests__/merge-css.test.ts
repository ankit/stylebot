import { mergeCss } from '../merge-css';

const AT = '2026-09-18T11:04:22.331Z';

const BASE = `body {
  color: #333;
}

a {
  color: #06c;
}`;

describe('mergeCss', () => {
  it('keeps both edits when the two sides changed different rules', () => {
    const local = `body {
  color: #333;
}

a {
  color: #0a7;
  text-decoration: none;
}`;

    const remote = `body {
  color: #333;
  font-size: 18px;
}

a {
  color: #06c;
}`;

    expect(mergeCss(BASE, local, remote, true, AT)).toEqual({
      css: `body {
  color: #333;
  font-size: 18px;
}

a {
  color: #0a7;
  text-decoration: none;
}`,
      conflicted: false,
    });
  });

  it('takes the only side that changed', () => {
    const local = BASE.replace('#06c', '#0a7');

    expect(mergeCss(BASE, local, BASE, false, AT)).toEqual({
      css: local,
      conflicted: false,
    });
    expect(mergeCss(BASE, BASE, local, true, AT)).toEqual({
      css: local,
      conflicted: false,
    });
  });

  it('keeps the winner live and parks the loser in a comment on a real conflict', () => {
    const local = BASE.replace('#06c', '#0a7');
    const remote = BASE.replace('#06c', '#c30');

    const { css, conflicted } = mergeCss(BASE, local, remote, true, AT);

    expect(conflicted).toBe(true);
    expect(css).toBe(`body {
  color: #333;
}

a {
  color: #0a7;
}

/* Stylebot sync conflict on 2026-09-18: another device had
  color: #c30;
*/
`);
  });

  it('lets the remote side win when it is the newer edit', () => {
    const local = BASE.replace('#06c', '#0a7');
    const remote = BASE.replace('#06c', '#c30');

    const { css } = mergeCss(BASE, local, remote, false, AT);

    expect(css).toContain('color: #c30;\n}');
    expect(css).toContain('another device had\n  color: #0a7;');
  });

  it('never emits conflict markers', () => {
    const { css } = mergeCss(
      'a {}',
      'a { color: red }',
      'a { color: blue }',
      true,
      AT
    );

    expect(css).not.toMatch(/^[<=>]{7}/m);
  });

  it('escapes a comment terminator inside the parked lines', () => {
    const local = 'a { color: red } /* mine */';
    const remote = 'a { color: blue } /* theirs */';

    const { css } = mergeCss('a {}', local, remote, true, AT);
    const comment = css.slice(css.indexOf('/* Stylebot'));

    expect(comment.indexOf('*/')).toBe(comment.lastIndexOf('*/'));
    expect(comment).toContain('/* theirs * /');
  });

  it('is not a conflict when the loser only deleted the lines', () => {
    const local = BASE.replace('#06c', '#0a7');
    const remote = `body {
  color: #333;
}`;

    expect(mergeCss(BASE, local, remote, true, AT)).toEqual({
      css: local,
      conflicted: false,
    });
  });

  it('parks the whole loser when there is no base', () => {
    const { css, conflicted } = mergeCss(
      '',
      'a { color: red }',
      'a { color: blue }',
      true,
      AT
    );

    expect(conflicted).toBe(true);
    expect(css.startsWith('a { color: red }')).toBe(true);
    expect(css).toContain('a { color: blue }');
  });
});
