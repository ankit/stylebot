import { shortenSelector } from './short-selector';

const shown = (selector: string, maxChars: number) => {
  const { pieces, more } = shortenSelector(selector, maxChars);
  return pieces.map(piece => piece.text).join('') + (more ? ` +${more}` : '');
};

describe('shortenSelector', () => {
  const long = '#\\34 9953495 td.title:nth-of-type(3) span.titleline > a';

  it('shows a selector that fits whole', () => {
    expect(shown(long, 80)).toBe(long);
  });

  it('drops whole compounds from the middle, keeping as many last ones as fit', () => {
    expect(shown(long, 40)).toBe('#\\34 9953495…span.titleline > a');
    expect(shown(long, 20)).toBe('#\\34 9953495…> a');
  });

  it("doesn't cut a selector with nothing in its middle", () => {
    expect(shown('td.title:nth-of-type(3) a', 10)).toBe(
      'td.title:nth-of-type(3) a'
    );
  });

  it("shows a list that doesn't fit as its first member and a count", () => {
    expect(shown('.subtext, .subtext a, .age', 20)).toBe('.subtext +2');
    expect(shown('.subtext > span::before, .subline > span::before', 30)).toBe(
      '.subtext > span::before +1'
    );
  });

  it('marks list separators and the ellipsis', () => {
    expect(shortenSelector('h1, h2', 20).pieces).toEqual([
      { text: 'h1' },
      { text: ', ', kind: 'separator' },
      { text: 'h2' },
    ]);
    expect(shortenSelector(long, 20).pieces[1]).toEqual({
      text: '…',
      kind: 'ellipsis',
    });
  });
});
