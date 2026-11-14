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

  it('keeps the current selector among the candidates', () => {
    const { candidates } = getSelectorAlternatives(
      pick(),
      'span.titleline a',
      ''
    );

    expect(candidates).toContain('span.titleline a');
  });

  it("keeps the style's rules even when one reaches what the current does", () => {
    const { existing, candidates } = getSelectorAlternatives(
      pick(),
      'span.titleline a',
      '.athing .titleline a { color: red; }'
    );

    expect(existing).toEqual(['.athing .titleline a']);
    expect(candidates).not.toContain('.athing .titleline a');
  });

  it('skips a page-wide rule that sets nothing on the element', () => {
    const { existing } = getSelectorAlternatives(
      pick(),
      'span.titleline a',
      ''
    );

    expect(existing).not.toContain('*');
  });

  describe('styled', () => {
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

    it('offers the saved rule, leaving out the suggestion that reaches the same elements', () => {
      const el = pickTitles();
      const plain = getSelectorAlternatives(el, '#link', '');
      const similar = plain.candidates.find(
        s => plain.descriptions?.[s]?.role === 'similar'
      ) as string;
      const reached = Array.from(document.querySelectorAll(similar));

      expect(reached).toEqual(
        Array.from(document.querySelectorAll('.titleline > a'))
      );

      const { styled, candidates } = getSelectorAlternatives(
        el,
        '.titleline > a',
        '.titleline > a { color: red; }'
      );

      expect(styled).toBe('.titleline > a');
      expect(candidates).not.toContain(similar);
      expect(
        candidates.filter(s => {
          const matches = Array.from(document.querySelectorAll(s));
          return (
            matches.length === reached.length &&
            matches.every((m, i) => m === reached[i])
          );
        })
      ).toEqual([]);
    });

    it('keeps every suggestion when the saved rule reaches different elements', () => {
      const el = pickTitles();
      document.body.insertAdjacentHTML('beforeend', '<a class="more">more</a>');
      const plain = getSelectorAlternatives(el, '#link', '');
      const { styled, candidates } = getSelectorAlternatives(
        el,
        '#link',
        ':is(#link, .more) { color: red; }'
      );

      expect(styled).toBe(':is(#link, .more)');
      expect(candidates).toEqual(plain.candidates);
    });

    it('offers the pick when it is one of several saved rules', () => {
      const el = pickTitles();
      const { styled } = getSelectorAlternatives(
        el,
        '.athing .titleline > a',
        '.titleline > a { color: red; } .athing .titleline > a { color: blue; }'
      );

      expect(styled).toBe('.athing .titleline > a');
    });

    it('offers the closest saved rule when the pick is not saved', () => {
      const el = pickTitles();
      document
        .querySelector('td')
        ?.insertAdjacentHTML('beforeend', '<a>more</a>');
      const { styled } = getSelectorAlternatives(
        el,
        '#link',
        'table a { color: red; } .titleline > a { color: blue; }'
      );

      expect(styled).toBe('.titleline > a');
    });

    it('offers no saved rule when the style has none for the element', () => {
      const { styled } = getSelectorAlternatives(
        pick(),
        'span.titleline a',
        ''
      );

      expect(styled).toBeUndefined();
    });
  });
});
