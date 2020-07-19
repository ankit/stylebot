import 'jest-fetch-mock';

import * as dedent from 'dedent';
import { addDeclaration } from '../declaration';

describe('declaration', () => {
  describe('addDeclaration', () => {
    describe('append rule', () => {
      it('without \\n\\n prefixed when existing css is empty', () => {
        const property = 'color';
        const value = 'red';
        const selector = 'a';
        const css = '';
        const output = addDeclaration(property, value, selector, css);

        expect(output).toBe(dedent`
          a {
            color: red;
          }`);
      });

      it('with \\n\\n prefixed when there are existing rules', () => {
        const property = 'color';
        const value = 'red';
        const selector = 'a';
        const css = dedent`
        div {
          background: red;
        }
        `;
        const output = addDeclaration(property, value, selector, css);

        expect(output).toBe(dedent`
          div {
            background: red;
          }

          a {
            color: red;
          }`);
      });

      it('does not append new rule when value is empty', () => {
        const property = 'color';
        const value = '';
        const selector = 'a';
        const css = dedent`
        div {
          background: red;
        }
        `;
        const output = addDeclaration(property, value, selector, css);
        expect(output).toBe(css);
      });
    });

    describe('append declaration', () => {
      it('with proper indentation', () => {
        const property = 'color';
        const value = 'green';
        const selector = 'div';
        const css = dedent`
          div {
            background: red;
          }
        `;

        const output = addDeclaration(property, value, selector, css);
        expect(output).toBe(dedent`  
          div {
            background: red;
            color: green;
          }
        `);
      });

      it('does not append declaration when value is empty', () => {
        const property = 'color';
        const value = '';
        const selector = 'div';
        const css = dedent`
          div {
            background: red;
          }
        `;

        const output = addDeclaration(property, value, selector, css);
        expect(output).toBe(css);
      });
    });

    it('modifies existing declaration with new value', () => {
      const property = 'background';
      const value = 'green';
      const selector = 'div';
      const css = dedent`
        div {
          background: red;
        }
      `;

      const output = addDeclaration(property, value, selector, css);
      expect(output).toBe(dedent`
        div {
          background: green;
        }
      `);
    });

    it('removes existing declaration if value is empty', () => {
      const property = 'background';
      const value = '';
      const selector = 'div';
      const css = dedent`
        div {
          color: blue;
          background: red;
        }
      `;

      const output = addDeclaration(property, value, selector, css);
      expect(output).toBe(dedent`
        div {
          color: blue;
        }
      `);
    });

    it('removes existing rule if empty after declaration removal', () => {
      const property = 'background';
      const value = '';
      const selector = 'div';
      const css = dedent`
        div {
          background: red;
        }
      `;

      const output = addDeclaration(property, value, selector, css);
      expect(output).toBe('');
    });
  });
});
