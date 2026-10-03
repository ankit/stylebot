import { parseInline, parseMarkdown } from './markdown';

describe('parseInline', () => {
  it('splits code, strong and em from text', () => {
    expect(
      parseInline('Use `a.WwrzSb` for **this** card, *not* _that_ one')
    ).toEqual([
      { type: 'text', text: 'Use ' },
      { type: 'code', text: 'a.WwrzSb' },
      { type: 'text', text: ' for ' },
      { type: 'strong', children: [{ type: 'text', text: 'this' }] },
      { type: 'text', text: ' card, ' },
      { type: 'em', children: [{ type: 'text', text: 'not' }] },
      { type: 'text', text: ' ' },
      { type: 'em', children: [{ type: 'text', text: 'that' }] },
      { type: 'text', text: ' one' },
    ]);
  });

  it('reads code inside strong', () => {
    expect(parseInline('**Avoid overrides on `div`** - my mistake')).toEqual([
      {
        type: 'strong',
        children: [
          { type: 'text', text: 'Avoid overrides on ' },
          { type: 'code', text: 'div' },
        ],
      },
      { type: 'text', text: ' - my mistake' },
    ]);
  });

  it('keeps markers inside code spans as text', () => {
    expect(parseInline('`**not bold**` and `` a`b ``')).toEqual([
      { type: 'code', text: '**not bold**' },
      { type: 'text', text: ' and ' },
      { type: 'code', text: 'a`b' },
    ]);
  });

  it('leaves snake_case and lone asterisks alone', () => {
    expect(parseInline('set font_size_px to 2 * 3')).toEqual([
      { type: 'text', text: 'set font_size_px to 2 * 3' },
    ]);
  });

  it('keeps a link’s text and drops its URL', () => {
    expect(parseInline('see [the docs](https://example.com) here')).toEqual([
      { type: 'text', text: 'see the docs here' },
    ]);
  });

  it('leaves markers still open mid-stream as text', () => {
    expect(parseInline('**Screenshots after')).toEqual([
      { type: 'text', text: '**Screenshots after' },
    ]);
    expect(parseInline('target `a.Ww')).toEqual([
      { type: 'text', text: 'target `a.Ww' },
    ]);
  });
});

describe('parseMarkdown', () => {
  it('separates paragraphs on blank lines and keeps line breaks within one', () => {
    expect(parseMarkdown('One\ntwo\n\nThree')).toEqual([
      {
        type: 'paragraph',
        lines: [
          [{ type: 'text', text: 'One' }],
          [{ type: 'text', text: 'two' }],
        ],
      },
      { type: 'paragraph', lines: [[{ type: 'text', text: 'Three' }]] },
    ]);
  });

  it('reads numbered and bulleted lists, joining indented continuations', () => {
    expect(
      parseMarkdown(
        'A few things:\n\n3. **First** - one\n   more\n4. Second\n\n- a\n* b'
      )
    ).toEqual([
      {
        type: 'paragraph',
        lines: [[{ type: 'text', text: 'A few things:' }]],
      },
      {
        type: 'list',
        ordered: true,
        start: 3,
        items: [
          [
            { type: 'strong', children: [{ type: 'text', text: 'First' }] },
            { type: 'text', text: ' - one more' },
          ],
          [{ type: 'text', text: 'Second' }],
        ],
      },
      {
        type: 'list',
        ordered: false,
        start: 1,
        items: [[{ type: 'text', text: 'a' }], [{ type: 'text', text: 'b' }]],
      },
    ]);
  });

  it('starts a new list when the kind changes', () => {
    const blocks = parseMarkdown('1. one\n- two');

    expect(blocks.map(block => block.type)).toEqual(['list', 'list']);
  });

  it('reads headings', () => {
    expect(parseMarkdown('## Colors\nText')).toEqual([
      { type: 'heading', line: [{ type: 'text', text: 'Colors' }] },
      { type: 'paragraph', lines: [[{ type: 'text', text: 'Text' }]] },
    ]);
  });

  it('keeps fenced code verbatim, and runs an unclosed fence to the end', () => {
    expect(
      parseMarkdown('Try:\n```css\na { color: red; }\n\n**x**\n```')
    ).toEqual([
      { type: 'paragraph', lines: [[{ type: 'text', text: 'Try:' }]] },
      { type: 'code', text: 'a { color: red; }\n\n**x**' },
    ]);
    expect(parseMarkdown('```\nhalf')).toEqual([
      { type: 'code', text: 'half' },
    ]);
  });

  it('treats raw HTML as text', () => {
    expect(parseMarkdown('<img src=x onerror=alert(1)>')).toEqual([
      {
        type: 'paragraph',
        lines: [[{ type: 'text', text: '<img src=x onerror=alert(1)>' }]],
      },
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
