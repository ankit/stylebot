import {
  PSEUDO_STATES,
  copyStateRules,
  getStateMarker,
  rewriteSelectorList,
} from './state-rules';

const HOVER = '[data-stylebot-force~="hover"]';
const FOCUS = '[data-stylebot-force~="focus"]';
const FOCUS_VISIBLE = '[data-stylebot-force~="focus-visible"]';
const FOCUS_WITHIN = '[data-stylebot-force~="focus-within"]';
const ACTIVE = '[data-stylebot-force~="active"]';

const squash = (css: string) => css.replace(/\s+/g, ' ').trim();

describe('rewriteSelectorList', () => {
  it('stands in for a state with one attribute selector, as specific as the pseudo-class', () => {
    PSEUDO_STATES.forEach(state =>
      expect(getStateMarker(state)).toMatch(/^\[[^[\]]+\]$/)
    );
  });

  it('swaps each state pseudo-class for its marker', () => {
    expect(rewriteSelectorList('a:hover')).toBe(`a${HOVER}`);
    expect(rewriteSelectorList('input:focus-visible')).toBe(
      `input${FOCUS_VISIBLE}`
    );
    expect(rewriteSelectorList('form:focus-within label')).toBe(
      `form${FOCUS_WITHIN} label`
    );
    expect(rewriteSelectorList('button:active:focus')).toBe(
      `button${ACTIVE}${FOCUS}`
    );
    expect(rewriteSelectorList('A:HOVER')).toBe(`A${HOVER}`);
  });

  it('keys a rule to an ancestor state, as .row:hover .icon', () => {
    expect(rewriteSelectorList('.row:hover .icon')).toBe(`.row${HOVER} .icon`);
  });

  it('keeps only the selectors of a list that name a state', () => {
    expect(rewriteSelectorList('a, a:hover, b:focus, .c')).toBe(
      `a${HOVER}, b${FOCUS}`
    );
    expect(rewriteSelectorList('a, .b')).toBeNull();
  });

  it('keeps every selector inside a rule that named a state', () => {
    expect(rewriteSelectorList('& .icon, &:hover', true)).toBe(
      `& .icon, &${HOVER}`
    );
  });

  it('rewrites inside :not(), :is() and :where()', () => {
    expect(rewriteSelectorList('.btn:not(:hover)')).toBe(`.btn:not(${HOVER})`);
    expect(rewriteSelectorList(':is(a:hover, b) span')).toBe(
      `:is(a${HOVER}, b) span`
    );
    expect(rewriteSelectorList(':where(:focus) > i')).toBe(
      `:where(${FOCUS}) > i`
    );
  });

  it('leaves pseudo-elements alone around a state', () => {
    expect(rewriteSelectorList('a:hover::before')).toBe(`a${HOVER}::before`);
    expect(rewriteSelectorList('a::before')).toBeNull();
  });

  it("doesn't take other pseudo-classes or a colon in a string for a state", () => {
    expect(rewriteSelectorList('a:hovered, a:focused')).toBeNull();
    expect(rewriteSelectorList('[title=":hover"], [data-x="a:focus"]')).toBe(
      null
    );
    expect(rewriteSelectorList('.md\\:hover\\:bg-red:hover')).toBe(
      `.md\\:hover\\:bg-red${HOVER}`
    );
  });
});

describe('copyStateRules', () => {
  it('copies only the rules that name a state', () => {
    expect(
      squash(
        copyStateRules(
          'a { color: red } a:hover { color: blue } .x { margin: 0 }'
        )
      )
    ).toBe(`a${HOVER} { color: blue }`);
  });

  it('keeps !important', () => {
    expect(
      squash(copyStateRules('.row:hover { background: #fff !important }'))
    ).toBe(`.row${HOVER} { background: #fff !important }`);
  });

  it('keeps the @media, @supports, @layer and @container around a rule', () => {
    const css = `
      @media (min-width: 600px) { .a { color: red } .a:hover { color: blue } }
      @supports (display: grid) { @layer base { .b:focus { outline: 0 } } }
      @container card (width > 300px) { .c:active { color: green } }
      @media print { .d { color: black } }
    `;

    expect(squash(copyStateRules(css))).toBe(
      squash(`
        @media (min-width: 600px) { .a${HOVER} { color: blue } }
        @supports (display: grid) { @layer base { .b${FOCUS} { outline: 0 } } }
        @container card (width > 300px) { .c${ACTIVE} { color: green } }
      `)
    );
  });

  it('copies nested rules under a parent without its own declarations', () => {
    expect(
      squash(
        copyStateRules(
          '.row { color: red; &:hover { color: blue } & .x { margin: 0 } }'
        )
      )
    ).toBe(`.row { &${HOVER} { color: blue } }`);
  });

  it('copies a state rule with everything nested in it', () => {
    expect(
      squash(
        copyStateRules('.row:hover { color: blue; & .icon { fill: red } }')
      )
    ).toBe(`.row${HOVER} { color: blue; & .icon { fill: red } }`);
  });

  it('copies pseudo-element rules shown in a state', () => {
    expect(squash(copyStateRules('a:hover::after { content: "→" }'))).toBe(
      `a${HOVER}::after { content: "→" }`
    );
  });

  it('copies a :not(:hover) rule with the marker negated', () => {
    expect(squash(copyStateRules('.btn:not(:hover) { opacity: 0.5 }'))).toBe(
      `.btn:not(${HOVER}) { opacity: 0.5 }`
    );
  });

  it('leaves @keyframes and @font-face out', () => {
    expect(
      copyStateRules(
        '@keyframes spin { to { rotate: 1turn } } @font-face { font-family: X; src: url(x.woff) }'
      )
    ).toBe('');
  });

  it("resolves relative urls against the sheet's own url", () => {
    expect(
      squash(
        copyStateRules(
          'a:hover { background: url("../img/a.png"), url(data:image/png;base64,AA) }',
          'https://cdn.example.com/css/site.css'
        )
      )
    ).toBe(
      `a${HOVER} { background: url("https://cdn.example.com/img/a.png"), url(data:image/png;base64,AA) }`
    );
  });

  it('returns nothing for css that has no state rules or does not parse', () => {
    expect(copyStateRules('a { color: red }')).toBe('');
    expect(copyStateRules('a:hover { color: red')).toBe('');
  });
});
