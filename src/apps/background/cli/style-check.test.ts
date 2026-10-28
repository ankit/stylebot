import {
  allDeclarations,
  changedDeclarations,
  compareRules,
  googleFontImports,
  parseCss,
  parseSavedCss,
  ruleSelectors,
  useStableSelectors,
} from './style-check';

describe('changedDeclarations', () => {
  it('returns only the declarations added or changed', () => {
    const before = parseCss('a { color: red; margin: 0; } p { color: blue; }');
    const after = parseCss(
      'a { color: green; margin: 0; } p { color: blue; } h1 { font-size: 2em; }'
    );

    expect(changedDeclarations(before, after)).toEqual([
      { selector: 'a', declarations: [{ property: 'color', value: 'green' }] },
      {
        selector: 'h1',
        declarations: [{ property: 'font-size', value: '2em' }],
      },
    ]);
  });

  it('tells a rule inside a media query from the same rule outside it', () => {
    const before = parseCss('a { color: red; }');
    const after = parseCss(
      'a { color: red; } @media (max-width: 600px) { a { color: red; } }'
    );

    expect(changedDeclarations(before, after)).toEqual([
      { selector: 'a', declarations: [{ property: 'color', value: 'red' }] },
    ]);
  });

  it('skips keyframe steps', () => {
    const after = parseCss('@keyframes fade { from { opacity: 0; } }');

    expect(changedDeclarations(parseCss(''), after)).toEqual([]);
  });
});

describe('compareRules', () => {
  it('lists the rules added or changed by index, and those removed', () => {
    const before = parseCss(
      'a { color: red; } p { color: blue; } .gone { margin: 0; }'
    );
    const after = parseCss(
      'a { color: red; } p { color: green; } h1 { font-size: 2em; }'
    );

    expect(compareRules(before, after)).toEqual({
      changed: [
        { index: 1, context: '' },
        { index: 2, context: '' },
      ],
      removed: [{ selector: '.gone', context: '' }],
    });
  });

  it('tells a rule inside a media query from the same rule outside it', () => {
    const before = parseCss(
      'a { color: red; } @media (max-width: 600px) { a { color: red; } }'
    );
    const after = parseCss('@media (max-width: 600px) { a { color: blue; } }');

    expect(compareRules(before, after)).toEqual({
      changed: [{ index: 0, context: '@media (max-width: 600px)' }],
      removed: [{ selector: 'a', context: '' }],
    });
  });

  it('counts a rule as changed when only !important changes', () => {
    const before = parseCss('a { color: red; }');
    const after = parseCss('a { color: red !important; }');

    expect(compareRules(before, after)?.changed).toEqual([
      { index: 0, context: '' },
    ]);
  });

  it('is null when there was no css before', () => {
    expect(compareRules(parseSavedCss(''), parseCss('a { color: red; }'))).toBe(
      null
    );
  });
});

describe('allDeclarations', () => {
  it('returns every declaration as an edit', () => {
    expect(allDeclarations(parseCss('a { color: red; }'))).toEqual([
      { selector: 'a', declarations: [{ property: 'color', value: 'red' }] },
    ]);
  });
});

describe('ruleSelectors', () => {
  it('lists every style rule, nested ones included', () => {
    const root = parseCss(
      'a { color: red; } @media print { .nav { display: none; } }'
    );

    expect(ruleSelectors(root)).toEqual(['a', '.nav']);
  });
});

describe('googleFontImports', () => {
  it('reads the families of Google Fonts imports only', () => {
    const root = parseCss(
      '@import url(https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400&display=swap);\n@import url(theme.css);'
    );

    expect(googleFontImports(root)).toEqual(['Source Serif 4']);
  });
});

describe('parseCss', () => {
  it('says where css stops parsing', () => {
    expect(() => parseCss('a { color: red;\n\nb {')).toThrow(
      /doesn't parse at line \d/
    );
  });
});

describe('parseSavedCss', () => {
  it('reads css that does not parse as empty', () => {
    expect(parseSavedCss('a { color: red;').nodes).toEqual([]);
  });
});

describe('useStableSelectors', () => {
  it('swaps partly hashed classes for their stable matchers in place', () => {
    const root = parseCss(
      '.Header_nav__a1B2c a { color: red; }\n@media (max-width: 600px) { .Header_nav__a1B2c { margin: 0; } }'
    );

    expect(useStableSelectors(root)).toEqual([
      {
        from: '.Header_nav__a1B2c a',
        to: '[class*="Header_nav__"] a',
      },
      {
        from: '.Header_nav__a1B2c',
        to: '[class*="Header_nav__"]',
      },
    ]);
    expect(root.toString()).toBe(
      '[class*="Header_nav__"] a { color: red; }\n@media (max-width: 600px) { [class*="Header_nav__"] { margin: 0; } }'
    );
  });

  it('leaves authored selectors and classes with no stable part alone', () => {
    const root = parseCss(
      '.menu a { color: red; } .css-1a0ymrn { margin: 0; }'
    );

    expect(useStableSelectors(root)).toEqual([]);
    expect(root.toString()).toBe(
      '.menu a { color: red; } .css-1a0ymrn { margin: 0; }'
    );
  });
});
