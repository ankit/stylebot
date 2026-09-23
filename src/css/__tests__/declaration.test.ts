const dedent = require('dedent');

import 'jest-fetch-mock';
import * as postcss from 'postcss';
import { addDeclaration, markDeclarationsImportant } from '../declaration';
import { getRule } from '../rule';

const appendImportantToDeclarations = (css: string): string => {
  const root = postcss.parse(css);
  markDeclarationsImportant(root);
  return root.toString();
};

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

    describe('when the selector belongs to a grouped rule', () => {
      it('splits it into its own rule, keeping what it already had and adding the new declaration', () => {
        const css = dedent`
          .mock-selector-1, .mock-selector-2 {
            color: red;
          }
        `;

        const output = addDeclaration(
          'background',
          'blue',
          '.mock-selector-1',
          css
        );

        expect(getRule(output, '.mock-selector-1')?.toString()).toBe(dedent`
          .mock-selector-1 {
            color: red;
            background: blue;
          }
        `);
      });

      it('leaves the other group members styled by the original rule', () => {
        const css = dedent`
          .mock-selector-1, .mock-selector-2 {
            color: red;
          }
        `;

        const output = addDeclaration(
          'background',
          'blue',
          '.mock-selector-1',
          css
        );

        expect(getRule(output, '.mock-selector-2')?.toString()).toBe(dedent`
          .mock-selector-2 {
            color: red;
          }
        `);
      });

      it('modifies the shared declaration only on the split-out rule', () => {
        const css = dedent`
          .mock-selector-1, .mock-selector-2 {
            color: red;
          }
        `;

        const output = addDeclaration(
          'color',
          'green',
          '.mock-selector-1',
          css
        );

        expect(getRule(output, '.mock-selector-1')?.toString()).toBe(dedent`
          .mock-selector-1 {
            color: green;
          }
        `);
        expect(getRule(output, '.mock-selector-2')?.toString()).toBe(dedent`
          .mock-selector-2 {
            color: red;
          }
        `);
      });
    });

    describe('with native CSS nesting', () => {
      const css = dedent`
        .card {
          color: red;
          & + & {
            margin-top: 8px;
          }
          .title {
            color: blue;
          }
          @media (min-width: 600px) {
            color: green;
          }
        }

        .title {
          color: pink;
        }
      `;

      it('edits the top-level rule, not a nested rule with the same selector', () => {
        const output = addDeclaration('color', 'black', '.title', css);

        expect(output).toBe(dedent`
          .card {
            color: red;
            & + & {
              margin-top: 8px;
            }
            .title {
              color: blue;
            }
            @media (min-width: 600px) {
              color: green;
            }
          }

          .title {
            color: black;
          }
        `);
      });

      it('appends a new top-level rule when only a nested rule has the selector', () => {
        const nestedOnly = dedent`
          .card {
            .title {
              color: blue;
            }
          }
        `;

        const output = addDeclaration('padding', '4px', '.title', nestedOnly);

        expect(output).toBe(dedent`
          .card {
            .title {
              color: blue;
            }
          }

          .title {
            padding: 4px;
          }
        `);
      });

      it("only changes the rule's own declaration, leaving nested ones intact", () => {
        const output = addDeclaration('color', 'black', '.card', css);

        expect(output).toBe(dedent`
          .card {
            color: black;
            & + & {
              margin-top: 8px;
            }
            .title {
              color: blue;
            }
            @media (min-width: 600px) {
              color: green;
            }
          }

          .title {
            color: pink;
          }
        `);
      });

      it('appends after the nested blocks without flattening them', () => {
        const output = addDeclaration('padding', '4px', '.card', css);

        expect(output).toBe(dedent`
          .card {
            color: red;
            & + & {
              margin-top: 8px;
            }
            .title {
              color: blue;
            }
            @media (min-width: 600px) {
              color: green;
            }
            padding: 4px;
          }

          .title {
            color: pink;
          }
        `);
      });

      it('keeps a rule that still has nested rules when its last declaration is removed', () => {
        const output = addDeclaration('color', '', '.card', css);

        expect(output).toBe(dedent`
          .card {
            & + & {
              margin-top: 8px;
            }
            .title {
              color: blue;
            }
            @media (min-width: 600px) {
              color: green;
            }
          }

          .title {
            color: pink;
          }
        `);
      });
    });
  });

  describe('markDeclarationsImportant', () => {
    it('appends !important inside nested rules and nested grouping at-rules', () => {
      const css = dedent`
        .card {
          color: red;
          & + & {
            margin-top: 8px;
          }
          .title, &:hover {
            color: blue;
          }
          @media (min-width: 600px) {
            padding: 1rem;
            .title {
              color: green;
            }
          }
          @supports (display: grid) {
            display: grid;
          }
          @container (min-width: 400px) {
            gap: 8px;
          }
          @layer overrides {
            opacity: 1;
          }
        }
      `;

      expect(appendImportantToDeclarations(css)).toEqual(dedent`
        .card {
          color: red !important;
          & + & {
            margin-top: 8px !important;
          }
          .title, &:hover {
            color: blue !important;
          }
          @media (min-width: 600px) {
            padding: 1rem !important;
            .title {
              color: green !important;
            }
          }
          @supports (display: grid) {
            display: grid !important;
          }
          @container (min-width: 400px) {
            gap: 8px !important;
          }
          @layer overrides {
            opacity: 1 !important;
          }
        }
      `);
    });

    it('appends !important inside a top-level grouping at-rule', () => {
      const css = dedent`
        @media (min-width: 600px) {
          .card {
            color: red;
          }
        }
      `;

      expect(appendImportantToDeclarations(css)).toEqual(dedent`
        @media (min-width: 600px) {
          .card {
            color: red !important;
          }
        }
      `);
    });

    it('leaves a descriptor at-rule nested in a grouping at-rule alone', () => {
      const css = dedent`
        @media (min-width: 600px) {
          @font-face {
            font-family: 'MS PGothic';
            src: local('Meiryo');
          }
        }
      `;

      expect(appendImportantToDeclarations(css)).toEqual(css);
    });

    it('correctly appends !important to declarations', () => {
      const css = dedent`
        * {
          font-family: Helvetica;
        }

        a {
          color: red;
        }
        `;

      const output = appendImportantToDeclarations(css);
      expect(output).toEqual(dedent`
        * {
          font-family: Helvetica !important;
        }

        a {
          color: red !important;
        }  
      `);
    });

    it('does not append !important to declarations whose ancestor is an atrule', () => {
      const css = dedent`
        @font-face {
          font-family: 'MS PGothic';
          src: local('Meiryo');
        }

        @page {
          margin: 1cm;
        }

        @keyframes slidein {
          from {
            transform: translateX(0%);
          }
        
          to {
            transform: translateX(100%);
          }
        }

        * {
          font-family: Helvetica;
        }

        a {
          color: red;
        }
        `;

      const output = appendImportantToDeclarations(css);
      expect(output).toEqual(dedent`
        @font-face {
          font-family: 'MS PGothic';
          src: local('Meiryo');
        }

        @page {
          margin: 1cm;
        }

        @keyframes slidein {
          from {
            transform: translateX(0%);
          }
        
          to {
            transform: translateX(100%);
          }
        }

        * {
          font-family: Helvetica !important;
        }

        a {
          color: red !important;
        }  
      `);
    });
  });
});
