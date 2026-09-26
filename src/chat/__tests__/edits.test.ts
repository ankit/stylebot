import {
  applyEdits,
  countCssLines,
  findEditLines,
  revertEdits,
} from '../edits';

describe('applyEdits / revertEdits', () => {
  it('adds new rules and reverts them away', () => {
    const edits = [
      {
        selector: '.title',
        declarations: [
          { property: 'font-size', value: '18px' },
          { property: 'color', value: 'red !important' },
        ],
      },
    ];

    const { css, previous } = applyEdits('', edits);

    expect(css).toContain('font-size: 18px');
    expect(css).toContain('color: red;');
    expect(previous).toEqual([
      { selector: '.title', property: 'font-size', value: null },
      { selector: '.title', property: 'color', value: null },
    ]);
    expect(revertEdits(css, previous).trim()).toBe('');
  });

  it('restores the value a declaration held before', () => {
    const before = 'a {\n  color: blue;\n  margin: 0;\n}';
    const { css, previous } = applyEdits(before, [
      { selector: 'a', declarations: [{ property: 'color', value: 'red' }] },
    ]);

    expect(css).toContain('color: red');
    expect(previous).toEqual([
      { selector: 'a', property: 'color', value: 'blue' },
    ]);
    expect(revertEdits(css, previous)).toBe(before);
  });

  it('removes a property when the value is empty, and puts it back', () => {
    const before = 'a {\n  color: blue;\n  margin: 0;\n}';
    const { css, previous } = applyEdits(before, [
      { selector: 'a', declarations: [{ property: 'margin', value: '' }] },
    ]);

    expect(css).not.toContain('margin');
    expect(revertEdits(css, previous)).toContain('margin: 0');
  });

  it('records the first previous value when a reply sets a property twice', () => {
    const { previous } = applyEdits('a { color: blue; }', [
      { selector: 'a', declarations: [{ property: 'color', value: 'red' }] },
      { selector: 'a', declarations: [{ property: 'color', value: 'green' }] },
    ]);

    expect(previous).toEqual([
      { selector: 'a', property: 'color', value: 'blue' },
    ]);
  });

  it('counts the lines the edits make as rules', () => {
    expect(
      countCssLines([
        {
          selector: 'a',
          declarations: [
            { property: 'color', value: 'red' },
            { property: 'margin', value: '0' },
          ],
        },
        { selector: 'b', declarations: [{ property: 'color', value: 'red' }] },
      ])
    ).toBe(7);
  });
});

describe('findEditLines', () => {
  const edits = [
    {
      selector: '.new',
      declarations: [{ property: 'color', value: 'red' }],
    },
    {
      selector: 'a',
      declarations: [{ property: 'margin', value: '4px' }],
    },
  ];

  it('covers a created rule whole and only the declarations set on an existing one', () => {
    const before = 'a {\n  color: blue;\n  margin: 0;\n}';
    const { css, previous } = applyEdits(before, edits);

    expect(css.split('\n')[2]).toContain('margin: 4px');
    expect(findEditLines(css, edits, previous)).toEqual([
      { startLine: 3, endLine: 3 },
      { startLine: 6, endLine: 8 },
    ]);
  });

  it('returns nothing for css that no longer parses', () => {
    expect(findEditLines('a {', edits, [])).toEqual([]);
  });
});
