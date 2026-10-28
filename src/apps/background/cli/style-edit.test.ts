import { useStableSelectors } from './style-check';
import { parseCss } from './stylesheet';

/**
 * The css with stable selectors swapped in, as saving writes it.
 */
const useStableSelectorsIn = (css: string): string => {
  const root = parseCss(css);
  useStableSelectors(root);
  return root.toString();
};
import { appendRules, diffRules, editRule, grepRules } from './style-edit';

const SHEET = [
  '/* Header */',
  '.header {',
  '  color: red;',
  '  margin: 0;',
  '}',
  '',
  '@media (max-width: 600px) {',
  '  .header {',
  '    color: blue;',
  '  }',
  '}',
  '',
  'p { color: #333; }',
  '',
].join('\n');

describe('editRule', () => {
  it('changes and adds declarations in the first rule with the selector, keeping the rest as written', () => {
    const { css, created } = editRule(SHEET, {
      selector: '.header',
      set: [
        { property: 'color', value: 'green' },
        { property: 'padding', value: '4px !important' },
      ],
    });

    expect(created).toBe(false);
    expect(css).toBe(
      SHEET.replace(
        '  color: red;\n  margin: 0;\n}',
        '  color: green;\n  margin: 0;\n  padding: 4px !important;\n}'
      )
    );
  });

  it('edits the rule inside the @media given', () => {
    const { css } = editRule(SHEET, {
      selector: '.header',
      media: '(max-width:  600px)',
      set: [{ property: 'color', value: 'pink' }],
    });

    expect(css).toContain('.header {\n  color: red;');
    expect(css).toContain('  .header {\n    color: pink;\n  }');
  });

  it('creates the rule at the end when none matches', () => {
    const { css, created } = editRule(SHEET, {
      selector: 'h1',
      set: [{ property: 'font-size', value: '2em' }],
    });

    expect(created).toBe(true);
    expect(css).toBe(`${SHEET.trimEnd()}\n\nh1 {\n  font-size: 2em;\n}\n`);
  });

  it("finds a rule saved by a generated class name's stable part", () => {
    const saved = editRule('', {
      selector: '.Header_nav__a1B2c',
      set: [{ property: 'color', value: 'red' }],
    });
    const stable = useStableSelectorsIn(saved.css);

    const { css, created } = editRule(stable, {
      selector: '.Header_nav__x9Y8z',
      set: [{ property: 'margin', value: '0' }],
    });

    expect(created).toBe(false);
    expect(parseCss(css).nodes).toHaveLength(1);
    expect(css).toContain('margin: 0');
  });

  it('creates the @media when it has none', () => {
    const { css } = editRule('a { color: red; }', {
      selector: 'a',
      media: 'print',
      set: [{ property: 'color', value: 'black' }],
    });

    expect(parseCss(css).last?.toString()).toContain('@media print');
    expect(css.startsWith('a { color: red; }')).toBe(true);
  });

  it('unsets declarations, naming those the rule lacked', () => {
    const { css, notFound } = editRule(SHEET, {
      selector: '.header',
      unset: ['margin', 'border'],
    });

    expect(css).toContain('.header {\n  color: red;\n}');
    expect(notFound).toEqual(['border']);
  });

  it('removes a rule left empty, and its @media with it', () => {
    const { css, deleted } = editRule(SHEET, {
      selector: '.header',
      media: '(max-width: 600px)',
      unset: ['color'],
    });

    expect(deleted).toBe(true);
    expect(css).not.toContain('@media');
    expect(css).toContain('.header {\n  color: red;');
  });

  it('deletes the rule', () => {
    const { css, deleted } = editRule(SHEET, { selector: 'p', delete: true });

    expect(deleted).toBe(true);
    expect(css).not.toContain('p {');
    expect(css).toContain('/* Header */');
  });

  it("refuses to unset or delete in a rule that isn't there", () => {
    expect(() => editRule(SHEET, { selector: 'h2', delete: true })).toThrow(
      'No rule for h2'
    );
    expect(() =>
      editRule(SHEET, { selector: 'p', media: 'print', unset: ['color'] })
    ).toThrow('No rule for p in @media print');
  });

  it("refuses a value that isn't one declaration", () => {
    expect(() =>
      editRule(SHEET, {
        selector: 'p',
        set: [{ property: 'color', value: 'red } body { color: red' }],
      })
    ).toThrow('Not one declaration');
  });
});

describe('appendRules', () => {
  it('adds the css at the end, keeping both as written', () => {
    const { css, duplicates } = appendRules(
      SHEET,
      '/* New */\nh1 { color: red; }\n'
    );

    expect(css).toBe(`${SHEET.trimEnd()}\n\n/* New */\nh1 { color: red; }\n`);
    expect(duplicates).toEqual([]);
  });

  it('names the rules added whose selector already has one', () => {
    const { duplicates } = appendRules(
      SHEET,
      '.header { color: pink; } @media (max-width: 600px) { p { margin: 0; } }'
    );

    expect(duplicates).toEqual([{ selector: '.header', context: '' }]);
  });

  it('moves an @import up to the top', () => {
    const { css } = appendRules(
      '@import url(a.css);\na { color: red; }\n',
      "@import url('b.css');\nb { color: blue; }"
    );

    expect(css).toBe(
      "@import url('b.css');\n@import url(a.css);\na { color: red; }\n\nb { color: blue; }\n"
    );
  });

  it('adds to an empty stylesheet', () => {
    expect(appendRules('', 'a { color: red; }').css).toBe(
      'a { color: red; }\n'
    );
  });
});

describe('grepRules', () => {
  it('keeps the rules whose selector or declarations match, in their @media', () => {
    expect(grepRules(SHEET, 'BLUE')).toBe(
      '@media (max-width: 600px) {\n  .header {\n    color: blue;\n  }\n}'
    );
    expect(grepRules(SHEET, 'header')).toBe(
      [
        '.header {',
        '  color: red;',
        '  margin: 0;',
        '}',
        '',
        '@media (max-width: 600px) {',
        '  .header {',
        '    color: blue;',
        '  }',
        '}',
      ].join('\n')
    );
  });

  it('matches imports and font faces by what they say', () => {
    const css =
      "@import url('https://fonts.googleapis.com/css2?family=Inter');\n@font-face { font-family: Mine; }\na { color: red; }";

    expect(grepRules(css, 'inter')).toBe(
      "@import url('https://fonts.googleapis.com/css2?family=Inter');"
    );
    expect(grepRules(css, 'mine')).toBe('@font-face { font-family: Mine; }');
  });

  it('is empty when nothing matches', () => {
    expect(grepRules(SHEET, 'nothing')).toBe('');
  });
});

describe('diffRules', () => {
  it('lists the rules added, the declarations changed and the rules removed', () => {
    const before = parseCss(
      'a { color: red; margin: 0; } p { color: blue; } .gone { margin: 0; }'
    );
    const after = parseCss(
      'a { color: green; margin: 0; } p { color: blue; } @media print { h1 { font-size: 2em; } }'
    );

    expect(diffRules(before, after)).toEqual({
      diff: [
        '  a {',
        '-   color: red;',
        '+   color: green;',
        '  }',
        '',
        '+ h1 (in @media print) {',
        '+   font-size: 2em;',
        '+ }',
        '',
        '- .gone {',
        '-   margin: 0;',
        '- }',
      ].join('\n'),
      added: 1,
      changed: 1,
      removed: 1,
    });
  });

  it('is empty when no rule changed', () => {
    const css = parseCss('a { color: red; }');

    expect(diffRules(css, parseCss('a {\n  color: red\n}')).diff).toBe('');
  });
});
