/* eslint-disable @typescript-eslint/no-var-requires */
const dedent = require('dedent');
import {
  getRule,
  getRuleForSelector,
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
});
