import {
  allDeclarations,
  changedDeclarations,
  googleFontImports,
  parseCss,
  parseSavedCss,
  ruleSelectors,
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
