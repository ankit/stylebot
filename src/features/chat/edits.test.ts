import { applyEdits, countCssLines, findEditLines, revertEdits } from './edits';

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

  it('reverts a group the reply later split a member out of', () => {
    const before = 'p {\n  margin: 0;\n}';
    const { css, previous } = applyEdits(before, [
      {
        selector: 'h1, h2, h3',
        declarations: [
          { property: 'font-family', value: 'Georgia' },
          { property: 'color', value: '#111' },
        ],
      },
      {
        selector: 'h1',
        declarations: [{ property: 'font-size', value: '40px' }],
      },
      { selector: 'h2', declarations: [{ property: 'color', value: '#333' }] },
    ]);

    expect(css).toContain('h3 {');
    expect(revertEdits(css, previous)).toBe(before);
  });

  it('puts back a group the user had once the reply splits it', () => {
    const before = 'h1, h2 {\n  color: red;\n}';
    const { css, previous } = applyEdits(before, [
      {
        selector: 'h1, h2',
        declarations: [{ property: 'color', value: 'blue' }],
      },
      { selector: 'h1', declarations: [{ property: 'margin', value: '0' }] },
    ]);
    const reverted = revertEdits(css, previous);

    expect(reverted).not.toContain('blue');
    expect(reverted).not.toContain('margin');
    expect(reverted.match(/color: red/g)).toHaveLength(2);
  });

  it('keeps earlier calls in step when a later one splits their group', () => {
    const first = applyEdits('', [
      {
        selector: 'h1, h2',
        declarations: [{ property: 'color', value: '#111' }],
      },
    ]);
    const second = applyEdits(
      first.css,
      [{ selector: 'h1', declarations: [{ property: 'color', value: 'red' }] }],
      { earlier: [first.previous] }
    );

    expect(second.previous).toEqual([
      { selector: 'h1', property: 'color', value: '#111' },
    ]);
    expect(revertEdits(second.css, second.previous)).toContain(
      'h1 {\n  color: #111;'
    );
    expect(
      revertEdits(second.css, [...second.earlier[0], ...second.previous]).trim()
    ).toBe('');
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
