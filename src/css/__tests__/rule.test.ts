/* eslint-disable @typescript-eslint/no-var-requires */
const dedent = require('dedent');
import { getRule, addEmptyRule, removeEmptyRules, removeRule } from '../';

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
