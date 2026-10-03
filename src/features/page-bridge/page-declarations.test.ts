import { getPageDeclarations } from './page-declarations';

describe('getPageDeclarations', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  const addStyle = (css: string, id?: string) => {
    const style = document.createElement('style');

    if (id) {
      style.id = id;
    }

    style.textContent = css;
    document.head.appendChild(style);
  };

  it('leaves out CSS-wide keywords and default sizes', () => {
    document.body.innerHTML = '<p id="p">hi</p>';
    addStyle('p { color: red; font-size: inherit; width: auto; }');

    expect(
      getPageDeclarations(document.getElementById('p') as HTMLElement)
    ).toEqual([{ property: 'color', value: 'red' }]);
  });

  it('shows the computed value in place of a var()', () => {
    document.body.innerHTML = '<p id="p">hi</p>';
    addStyle('p { color: var(--ink); }');
    const el = document.getElementById('p') as HTMLElement;
    const computed = { getPropertyValue: () => 'rgb(1, 2, 3)' };
    const spy = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue(computed as unknown as CSSStyleDeclaration);

    expect(getPageDeclarations(el)).toEqual([
      { property: 'color', value: 'rgb(1, 2, 3)' },
    ]);

    spy.mockRestore();
  });

  it('ignores rules for interaction states like :hover', () => {
    document.body.innerHTML = '<a id="a" href="#">hi</a>';
    addStyle('a { color: blue; } a:hover, a:focus { color: red; }');
    const el = document.getElementById('a') as HTMLElement;
    jest.spyOn(el, 'matches').mockReturnValue(true);

    expect(getPageDeclarations(el)).toEqual([
      { property: 'color', value: 'blue' },
    ]);
  });

  it("picks what wins among the page's rules, leaving out the user's styles and the editor's", () => {
    document.body.innerHTML = '<p class="note" id="p">hi</p>';
    addStyle(
      'p.note { color: red; } p { color: blue; font-size: 10pt; } p { line-height: 1 !important; } #p { line-height: 2; }'
    );
    addStyle(
      'div, p { font-weight: bold; font-size: 12px; }',
      'stylebot-css-example'
    );
    addStyle('p { color: green; }', 'stylebot-editor-css');

    expect(
      getPageDeclarations(document.getElementById('p') as HTMLElement)
    ).toEqual([
      { property: 'color', value: 'red' },
      { property: 'font-size', value: '10pt' },
      { property: 'line-height', value: '1' },
    ]);
  });
});
