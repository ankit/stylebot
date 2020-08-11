/* eslint-disable @typescript-eslint/no-var-requires */
const dedent = require('dedent');
import { getRule, addEmptyRule } from '../';

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
});
