import { getSelectorSuggestions } from '@stylebot/css';

import { getSelectorAlternatives } from './selector-alternatives';

describe('getSelectorAlternatives', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const pick = () => {
    document.body.innerHTML = `
      <table><tr class="athing"><td class="title">
        <span class="titleline"><a id="link">story</a></span>
      </td></tr></table>
    `;
    return document.getElementById('link') as HTMLElement;
  };

  const pickTitles = () => {
    document.body.innerHTML = `
      <table>
        <tr class="athing"><td class="title">
          <span class="titleline"><a id="link">one</a></span>
        </td></tr>
        <tr class="athing"><td class="title">
          <span class="titleline"><a>two</a></span>
        </td></tr>
      </table>
    `;
    return document.getElementById('link') as HTMLElement;
  };

  const similarOf = (el: HTMLElement) => {
    const { candidates, descriptions } = getSelectorAlternatives(el, '');

    return candidates.find(s => descriptions?.[s]?.role === 'similar');
  };

  it('counts the elements each candidate matches', () => {
    const { candidates, counts = {} } = getSelectorAlternatives(
      pickTitles(),
      ''
    );
    const reach = candidates.map(s => counts[s]);

    expect(candidates.length).toBeGreaterThan(1);
    expect(reach).toEqual(
      candidates.map(s => document.querySelectorAll(s).length)
    );
  });

  it('keeps the candidates most stable first, saved rules ahead', () => {
    const el = pickTitles();
    const { candidates } = getSelectorAlternatives(el, 'td a { color: red; }');
    const suggested = getSelectorSuggestions(el).map(s => s.selector);
    const order = candidates.slice(1).map(s => suggested.indexOf(s));

    expect(candidates[0]).toBe('td a');
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('skips a page-wide rule that sets nothing on the element', () => {
    const { existing } = getSelectorAlternatives(pick(), '');

    expect(existing).not.toContain('*');
  });

  it('offers a saved rule in place of the suggestion that matches the same elements', () => {
    const el = pickTitles();
    const similar = similarOf(el) as string;

    expect(Array.from(document.querySelectorAll(similar))).toEqual(
      Array.from(document.querySelectorAll('.titleline > a'))
    );

    const { existing, candidates, descriptions } = getSelectorAlternatives(
      el,
      '.titleline > a { color: red; }'
    );

    expect(existing).toEqual(['.titleline > a']);
    expect(candidates).toContain('.titleline > a');
    expect(candidates).not.toContain(similar);
    expect(descriptions?.['.titleline > a']?.role).toBe('similar');
  });

  it('offers a saved rule that matches just the element', () => {
    const saved = 'tr:first-child .titleline > a';
    const { candidates } = getSelectorAlternatives(
      pickTitles(),
      `${saved} { color: red; }`
    );

    expect(candidates).toContain(saved);
  });

  it('leaves out a saved rule that matches what no suggestion does', () => {
    const el = pickTitles();
    document.body.insertAdjacentHTML('beforeend', '<a class="more">more</a>');
    const plain = getSelectorAlternatives(el, '');
    const { existing, candidates } = getSelectorAlternatives(
      el,
      ':is(#link, .more) { color: red; }'
    );

    expect(existing).toEqual([':is(#link, .more)']);
    expect(candidates).toEqual(plain.candidates);
  });
});
