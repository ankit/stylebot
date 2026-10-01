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
});
