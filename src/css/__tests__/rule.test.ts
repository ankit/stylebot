const dedent = require('dedent');
import * as postcss from 'postcss';
import {
  getRule,
  isNestedRule,
  withOwnDeclarationsOnly,
  getRuleForSelector,
  getDeclarationsForSelector,
  getExistingSelector,
  splitSelectorFromGroup,
  addEmptyRule,
  removeEmptyRules,
  removeRule,
} from '../';

describe('rule', () => {
  describe('getRule', () => {
    it('returns rule if found for given css', async () => {
      const ruleCss = dedent`
        .mock-selector-1 {
        background: red;
        }
      `;

      const css = dedent`
        ${ruleCss}

        .mock-selector-2 {
          color: green;
        }
      `;

      const selector = '.mock-selector-1';
      expect(getRule(css, selector)?.toString()).toEqual(ruleCss);
    });

    it('returns null if not found', async () => {
      const ruleCss = dedent`
        .mock-selector-1 {
        background: red;
        }
      `;

      const css = dedent`
        ${ruleCss}

        .mock-selector-2 {
          color: green;
        }
      `;

      const selector = '.mock-selector-3';
      expect(getRule(css, selector)).toEqual(null);
    });
  });

  describe('getDeclarationsForSelector', () => {
    const css = dedent`
      .mock-selector-1, .mock-selector-2 {
        color: red;
        background: blue;
      }

      .mock-selector-3 {
      }
    `;

    it('returns the declarations of a whole grouped selector', () => {
      expect(
        getDeclarationsForSelector(css, '.mock-selector-1, .mock-selector-2')
      ).toEqual([
        { property: 'color', value: 'red' },
        { property: 'background', value: 'blue' },
      ]);
    });

    it('returns the declarations of a member of a grouped selector', () => {
      expect(getDeclarationsForSelector(css, '.mock-selector-2')).toEqual([
        { property: 'color', value: 'red' },
        { property: 'background', value: 'blue' },
      ]);
    });

    it('returns null for an empty rule', () => {
      expect(getDeclarationsForSelector(css, '.mock-selector-3')).toEqual(null);
    });

    it('returns null if not found', () => {
      expect(getDeclarationsForSelector(css, '.mock-selector-4')).toEqual(null);
    });
  });

  describe('splitSelectorFromGroup', () => {
    it('splits a grouped selector into its own rule, carrying over its declarations', () => {
      const css = dedent`
        .mock-selector-1, .mock-selector-2 {
          color: red;
          background: blue;
        }
      `;

      const output = splitSelectorFromGroup(css, '.mock-selector-1');

      expect(getRule(output, '.mock-selector-1')?.toString()).toEqual(dedent`
        .mock-selector-1 {
          color: red;
          background: blue;
        }
      `);
    });

    it('places the split-out rule right after the group, separated by a blank line', () => {
      const css = dedent`
        .mock-selector-1, .mock-selector-2 {
          color: red;
        }

        .mock-selector-3 {
          color: blue;
        }
      `;

      expect(splitSelectorFromGroup(css, '.mock-selector-1')).toEqual(dedent`
        .mock-selector-2 {
          color: red;
        }

        .mock-selector-1 {
          color: red;
        }

        .mock-selector-3 {
          color: blue;
        }
      `);
    });

    it('leaves the rest of the group styled by the original rule', () => {
      const css = dedent`
        .mock-selector-1, .mock-selector-2 {
          color: red;
        }
      `;

      const output = splitSelectorFromGroup(css, '.mock-selector-1');

      expect(getRule(output, '.mock-selector-2')?.toString()).toEqual(dedent`
        .mock-selector-2 {
          color: red;
        }
      `);
    });

    it('leaves css unchanged when the selector already has its own rule', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(splitSelectorFromGroup(css, '.mock-selector-1')).toEqual(css);
    });

    it('leaves css unchanged when the selector is not styled at all', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(splitSelectorFromGroup(css, '.mock-selector-2')).toEqual(css);
    });

    it('splits from the last matching group, mirroring getRuleForSelector', () => {
      const css = dedent`
        .mock-selector-1, .mock-selector-2 {
          color: red;
        }

        .mock-selector-1, .mock-selector-3 {
          color: blue;
        }
      `;

      const output = splitSelectorFromGroup(css, '.mock-selector-1');

      expect(getRuleForSelector(output, '.mock-selector-1')?.toString())
        .toEqual(dedent`
        .mock-selector-1 {
          color: blue;
        }
      `);
    });
  });

  describe('getExistingSelector', () => {
    it('returns a selector that matches the element', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      const el = document.createElement('div');
      el.matches = jest.fn(selector => selector === '.mock-selector-1');

      expect(getExistingSelector(el, css)).toBe('.mock-selector-1');
    });

    it('returns null when nothing matches', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      const el = document.createElement('div');
      el.matches = jest.fn(() => false);

      expect(getExistingSelector(el, css)).toBeNull();
    });

    it("skips a :hover selector even though el.matches() would say it matches (it's only true because the inspector's own cursor is over the element)", () => {
      const css = dedent`
        .mock-selector-1:hover {
          color: red;
        }
      `;

      const el = document.createElement('div');
      el.matches = jest.fn(() => true);

      expect(getExistingSelector(el, css)).toBeNull();
    });

    it('skips :focus, :focus-visible, :focus-within and :active the same way', () => {
      const css = dedent`
        .mock-selector-1:focus {
          color: red;
        }

        .mock-selector-2:focus-visible {
          color: red;
        }

        .mock-selector-3:focus-within {
          color: red;
        }

        .mock-selector-4:active {
          color: red;
        }
      `;

      const el = document.createElement('div');
      el.matches = jest.fn(() => true);

      expect(getExistingSelector(el, css)).toBeNull();
    });

    it('still matches a non-state selector in the same rule as a state one', () => {
      const css = dedent`
        .mock-selector-1:hover, .mock-selector-2 {
          color: red;
        }
      `;

      const el = document.createElement('div');
      el.matches = jest.fn(selector => selector === '.mock-selector-2');

      expect(getExistingSelector(el, css)).toBe('.mock-selector-2');
    });

    describe('only reuses a selector that targets the element itself', () => {
      const pick = (html: string, css: string): string | null => {
        document.body.innerHTML = html;
        return getExistingSelector(
          document.querySelector('#picked') as HTMLElement,
          css
        );
      };

      it('skips `*`, which matches every element on the page', () => {
        expect(
          pick('<h1 id="picked" class="title">Hi</h1>', '* { color: red; }')
        ).toBeNull();
      });

      it('skips a bare tag or a descendant ending in one, like `.card p`', () => {
        const css = dedent`
          a { color: red; }
          .card p { color: red; }
        `;

        expect(
          pick(
            '<div class="card"><p id="picked" class="lede">Hi</p></div>',
            css
          )
        ).toBeNull();
      });

      it('reuses a tag-only selector when it is what would be generated anyway', () => {
        expect(
          pick(
            '<div class="mw-heading"><h2 id="picked">Hi</h2></div>',
            'div.mw-heading h2 { color: red; }'
          )
        ).toBe('div.mw-heading h2');
      });

      it('reuses a selector whose subject has a class, id, attribute or position', () => {
        const html =
          '<ul class="nav"><li><a id="picked" class="link" href="/x">x</a></li></ul>';

        expect(pick(html, '* { color: red; } .nav .link { color: red; }')).toBe(
          '.nav .link'
        );
        expect(pick(html, 'a#picked { color: red; }')).toBe('a#picked');
        expect(pick(html, 'ul a[href="/x"] { color: red; }')).toBe(
          'ul a[href="/x"]'
        );
        expect(pick(html, '.nav li:first-child a { color: red; }')).toBeNull();
        expect(pick(html, '.nav li a:first-child { color: red; }')).toBe(
          '.nav li a:first-child'
        );
      });

      it("doesn't split on a combinator inside brackets, parens or quotes", () => {
        const html =
          '<ul class="nav"><li><a id="picked" title="a b" href="/x">x</a></li></ul>';

        expect(pick(html, '.nav a[title="a b"] { color: red; }')).toBe(
          '.nav a[title="a b"]'
        );
        expect(pick(html, '.nav a:nth-child(2n + 1) { color: red; }')).toBe(
          '.nav a:nth-child(2n + 1)'
        );
        expect(pick(html, '.nav li:is(.x, li) a { color: red; }')).toBeNull();
      });
    });
  });

  describe('addEmptyRule', () => {
    it('adds empty rule for selector to css', () => {
      const selector = '.mock-selector-3';
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }`;

      const output = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }

        .mock-selector-3 {
          
        }
      `;

      expect(addEmptyRule(css, selector)).toEqual(output);
    });

    it('handles single newline correctly', () => {
      const selector = '.mock-selector-3';
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }
      `;

      const output = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }

        .mock-selector-3 {
          
        }
      `;

      expect(addEmptyRule(css, selector)).toEqual(output);
    });

    it('handles multiple newlines correctly', () => {
      const selector = '.mock-selector-3';
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }
      
      
      
      `;

      const output = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }

        .mock-selector-3 {
          
        }
      `;

      expect(addEmptyRule(css, selector)).toEqual(output);
    });
  });

  describe('removeEmptyRules', () => {
    it('removes empty rules from css', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {

        }`;

      const output = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(removeEmptyRules(css)).toEqual(output);
    });
  });

  describe('removeRule', () => {
    it('removes the rule matching the selector', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: green;
        }
      `;

      const output = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(removeRule(css, '.mock-selector-2')).toEqual(output);
    });

    it('leaves css unchanged when the selector is not found', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(removeRule(css, '.mock-selector-2')).toEqual(css);
    });

    it('removes every rule matching the selector', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }

        .mock-selector-2 {
          color: blue;
        }

        .mock-selector-1 {
          background: yellow;
        }
      `;

      const output = dedent`
        .mock-selector-2 {
          color: blue;
        }
      `;

      expect(removeRule(css, '.mock-selector-1')).toEqual(output);
    });
  });

  describe('with native CSS nesting', () => {
    const css = dedent`
      .card {
        color: red;
        & + & {
          margin-top: 8px;
        }
        .title, .subtitle {
          color: blue;
        }
        @media (min-width: 600px) {
          .title {
            color: green;
          }
        }
      }

      .title {
        color: pink;
      }
    `;

    it('isNestedRule is true for rules inside a rule, at any depth', () => {
      const nested: Array<boolean> = [];
      postcss.parse(css).walkRules(rule => nested.push(isNestedRule(rule)));

      expect(nested).toEqual([false, true, true, true, false]);
    });

    it('getRule returns the top-level rule, not a nested one with the same selector', () => {
      expect(getRule(css, '.title')?.toString()).toEqual(dedent`
        .title {
          color: pink;
        }
      `);
    });

    it('getRule prefers a top-level rule over one inside an at-rule', () => {
      const conditionalFirst = dedent`
        @media (min-width: 600px) {
          .title {
            color: green;
          }
        }

        .title {
          color: pink;
        }
      `;

      expect(getRule(conditionalFirst, '.title')?.parent?.type).toBe('root');
    });

    it('getRule returns null when the selector only exists nested', () => {
      expect(getRule(css, '& + &')).toBeNull();
      expect(getRule(css, '.subtitle')).toBeNull();
    });

    it('getRuleForSelector ignores nested grouped rules', () => {
      expect(getRuleForSelector(css, '.subtitle')).toBeNull();
    });

    it("getDeclarationsForSelector returns only the rule's own declarations", () => {
      expect(getDeclarationsForSelector(css, '.card')).toEqual([
        { property: 'color', value: 'red' },
      ]);
    });

    it('withOwnDeclarationsOnly drops nested rules and at-rules', () => {
      const rule = getRule(css, '.card');

      expect(rule && withOwnDeclarationsOnly(rule).toString()).toEqual(dedent`
        .card {
          color: red;
        }
      `);
    });

    it('getExistingSelector never returns a nested selector', () => {
      const el = document.createElement('div');
      el.matches = jest.fn(selector => selector === '.subtitle');

      expect(getExistingSelector(el, css)).toBeNull();
    });

    it('splitSelectorFromGroup leaves a nested group alone', () => {
      expect(splitSelectorFromGroup(css, '.subtitle')).toEqual(css);
    });

    it('splitSelectorFromGroup keeps nested blocks intact when splitting a top-level group', () => {
      const grouped = dedent`
        .a, .b {
          color: red;
          .title {
            color: blue;
          }
        }
      `;

      const output = splitSelectorFromGroup(grouped, '.a');

      expect(getRule(output, '.a')?.toString()).toEqual(dedent`
        .a {
          color: red;
          .title {
            color: blue;
          }
        }
      `);
      expect(getRule(output, '.b')?.toString()).toEqual(dedent`
        .b {
          color: red;
          .title {
            color: blue;
          }
        }
      `);
    });

    it('removeRule removes the top-level rule only', () => {
      expect(removeRule(css, '.title')).toEqual(dedent`
        .card {
          color: red;
          & + & {
            margin-top: 8px;
          }
          .title, .subtitle {
            color: blue;
          }
          @media (min-width: 600px) {
            .title {
              color: green;
            }
          }
        }
      `);
    });

    it('removeEmptyRules removes a rule left holding only an empty nested rule', () => {
      const emptyNested = dedent`
        .card {
          .title {
          }
        }

        .other {
          color: red;
        }
      `;

      expect(removeEmptyRules(emptyNested)).toEqual(dedent`
        .other {
          color: red;
        }
      `);
    });
  });
});
