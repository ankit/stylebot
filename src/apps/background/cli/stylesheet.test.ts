import {
  listStyleRules,
  matchRules,
  parseCss,
  parseSavedCss,
} from './stylesheet';

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

describe('listStyleRules', () => {
  it('lists each style rule with its context, selector on one line', () => {
    const root = parseCss(
      '.a,\n.b { color: red !important; } @media print { p { margin: 0; } } @keyframes x { from { opacity: 0; } }'
    );

    expect(listStyleRules(root)).toEqual([
      {
        selector: '.a, .b',
        context: '',
        declarations: ['color: red !important'],
      },
      { selector: 'p', context: '@media print', declarations: ['margin: 0'] },
    ]);
  });
});

describe('matchRules', () => {
  it('matches each old rule once, in order, leaving the rest as removed', () => {
    const before = listStyleRules(
      parseCss('h1 { color: red; } h1 { margin: 0; } p { color: blue; }')
    );
    const after = listStyleRules(
      parseCss('h1 { color: red; } a { color: red; }')
    );
    const { matches, removed } = matchRules(before, after);

    expect(matches).toEqual([
      { rule: after[0], old: before[0] },
      { rule: after[1], old: undefined },
    ]);
    expect(removed).toEqual([before[1], before[2]]);
  });
});
