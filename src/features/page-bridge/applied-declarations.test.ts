import { getAppliedDeclarations } from './applied-declarations';

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

    expect(getAppliedDeclarations(el, 'p { color: var(--ink); }')).toEqual([
      {
        property: 'color',
        value: 'rgb(1, 2, 3)',
        selector: 'p',
        everywhere: true,
      },
    ]);

    spy.mockRestore();
  });

  it('ignores rules for interaction states like :hover', () => {
    document.body.innerHTML = '<a id="a" href="#">hi</a>';
    addStyle('a:hover, a:focus { color: red; }', 'stylebot-css-example');
    const el = document.getElementById('a') as HTMLElement;
    jest.spyOn(el, 'matches').mockReturnValue(true);

    expect(
      getAppliedDeclarations(el, 'a:hover, a:focus { color: red; }')
    ).toEqual([]);
  });

  it('keeps Stylebot declarations that win over the page', () => {
    document.body.innerHTML = '<p class="note" id="p">hi</p>';
    addStyle(
      'p.note { color: red; } p { font-size: 10pt; } #p { line-height: 2; }'
    );
    const css =
      'div, p { color: blue; font-weight: bold; font-size: 12px; line-height: 1; }';
    addStyle(css, 'stylebot-css-example');
    addStyle('p { color: green; }', 'stylebot-editor-css');

    expect(
      getAppliedDeclarations(document.getElementById('p') as HTMLElement, css)
    ).toEqual([
      { property: 'font-size', value: '12px', selector: 'p', everywhere: true },
      {
        property: 'font-weight',
        value: 'bold',
        selector: 'p',
        everywhere: true,
      },
    ]);
  });

  it('names the selector as the user wrote it, not as the browser serialized it', () => {
    document.body.innerHTML = '<div><p id="p">hi</p></div>';
    // jsdom keeps selectors as written; browsers add spaces around combinators.
    addStyle('div > p { color: red; }', 'stylebot-css-example');
    const insertRule = CSSStyleSheet.prototype.insertRule;
    const spy = jest
      .spyOn(CSSStyleSheet.prototype, 'insertRule')
      .mockImplementation(function (
        this: CSSStyleSheet,
        rule: string,
        index?: number
      ) {
        return insertRule.call(this, rule.replace('>', ' > '), index);
      });

    expect(
      getAppliedDeclarations(
        document.getElementById('p') as HTMLElement,
        'div>p { color: red; }'
      )
    ).toEqual([
      { property: 'color', value: 'red', selector: 'div>p', everywhere: true },
    ]);

    spy.mockRestore();
  });

  it('says whether the winning selector reaches every element the inspected one matches', () => {
    document.body.innerHTML =
      '<p id="intro" class="intro">a</p><p id="other">b</p>';
    const css = 'p { color: blue; } .intro { color: red; font-size: 20px; }';
    addStyle(css, 'stylebot-css-example');
    const intro = document.getElementById('intro') as HTMLElement;
    const paragraphs = Array.from(document.querySelectorAll('p'));

    expect(getAppliedDeclarations(intro, css, paragraphs)).toEqual([
      {
        property: 'color',
        value: 'red',
        selector: '.intro',
        everywhere: false,
      },
      {
        property: 'font-size',
        value: '20px',
        selector: '.intro',
        everywhere: false,
      },
    ]);
    expect(getAppliedDeclarations(intro, css, [intro])).toEqual([
      { property: 'color', value: 'red', selector: '.intro', everywhere: true },
      {
        property: 'font-size',
        value: '20px',
        selector: '.intro',
        everywhere: true,
      },
    ]);
  });
});
