import { getAppliedDeclarations, wins } from './applied-declarations';

describe('wins', () => {
  const candidate = (
    specificity: [number, number, number, number],
    important = false
  ) => ({ important, specificity });

  it('takes the first candidate for a property', () => {
    expect(wins(candidate([0, 0, 0, 1]), undefined)).toBe(true);
  });

  it('lets !important beat a more specific normal declaration', () => {
    expect(wins(candidate([0, 0, 0, 1], true), candidate([0, 1, 0, 0]))).toBe(
      true
    );
    expect(wins(candidate([0, 1, 0, 0]), candidate([0, 0, 0, 1], true))).toBe(
      false
    );
  });

  it('lets the more specific declaration win, and the later on a tie', () => {
    expect(wins(candidate([0, 0, 1, 0]), candidate([0, 0, 0, 2]))).toBe(true);
    expect(wins(candidate([0, 0, 0, 2]), candidate([0, 0, 1, 0]))).toBe(false);
    expect(wins(candidate([0, 0, 1, 0]), candidate([0, 0, 1, 0]))).toBe(true);
  });
});

describe('getAppliedDeclarations', () => {
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

  it('shows the computed value in place of a var()', () => {
    document.body.innerHTML = '<p id="p">hi</p>';
    addStyle('p { color: var(--ink); }', 'stylebot-css-example');
    const el = document.getElementById('p') as HTMLElement;
    const computed = { getPropertyValue: () => 'rgb(1, 2, 3)' };
    const spy = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue(computed as unknown as CSSStyleDeclaration);

    expect(getAppliedDeclarations(el)).toEqual([
      { property: 'color', value: 'rgb(1, 2, 3)', selector: 'p' },
    ]);

    spy.mockRestore();
  });

  it('ignores rules for interaction states like :hover', () => {
    document.body.innerHTML = '<a id="a" href="#">hi</a>';
    addStyle('a:hover, a:focus { color: red; }', 'stylebot-css-example');
    const el = document.getElementById('a') as HTMLElement;
    jest.spyOn(el, 'matches').mockReturnValue(true);

    expect(getAppliedDeclarations(el)).toEqual([]);
  });

  it('keeps Stylebot declarations that win over the page', () => {
    document.body.innerHTML = '<p class="note" id="p">hi</p>';
    addStyle(
      'p.note { color: red; } p { font-size: 10pt; } #p { line-height: 2; }'
    );
    addStyle(
      'div, p { color: blue; font-weight: bold; font-size: 12px; line-height: 1; }',
      'stylebot-css-example'
    );
    addStyle('p { color: green; }', 'stylebot-editor-css');

    expect(
      getAppliedDeclarations(document.getElementById('p') as HTMLElement)
    ).toEqual([
      { property: 'font-size', value: '12px', selector: 'p' },
      { property: 'font-weight', value: 'bold', selector: 'p' },
    ]);
  });
});
