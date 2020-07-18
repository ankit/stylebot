import 'jest-fetch-mock';

import * as dedent from 'dedent';
import {
  addDeclaration,
  addGoogleWebFont,
  cleanGoogleWebFonts,
} from '../CssUtils';

describe('CssUtils', () => {
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

  describe('addGoogleWebFont', () => {
    it('adds @import rule for font at the top of css', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css = 'a { font-family: Muli; }';
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(
        '@import url(//fonts.googleapis.com/css?family=Muli);\n\na { font-family: Muli; }'
      );
    });

    it('does not add @import rule if it already exists', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\n\na { font-family: Muli }';
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API returns 400', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 400 }));

      const css = 'a { font-family: Roboto; }';
      const output = await addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API request fails', async () => {
      fetchMock.mockResponse(() => Promise.reject());

      const css = 'a { font-family: Roboto; }';
      const output = await addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });
  });

  describe('cleanGoogleWebFonts', () => {
    it('removes @import rule for unused font', () => {
      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\n\na { color: red; }';

      const output = cleanGoogleWebFonts(css);
      expect(output).toBe('a { color: red; }');
    });

    it('does not remove @import rule for used font', () => {
      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\n\na { font-family: Muli, Helvetica; }';
      const output = cleanGoogleWebFonts(css);
      expect(output).toBe(css);
    });
  });
});
