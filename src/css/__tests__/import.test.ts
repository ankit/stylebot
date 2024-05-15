/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any */

const dedent = require('dedent');
import { getCssWithExpandedImports } from '../import';

const mockFontCss = dedent`
  /* latin-ext */
  @font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  /* latin */
  @font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wXiWtFCc.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`;

const mockExampleCss = dedent`
  .example {
  border: none;
  }
`;

global.chrome = {
  runtime: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error: not able to figure out how to override sendMessage here correctly.
    sendMessage: (message: any, callback: (response: any) => void) => {
      if (message.url === 'https://fonts.googleapis.com/css?family=Lato') {
        callback(mockFontCss);
      } else if (message.url === 'https://example2.css') {
        callback(mockExampleCss);
      } else {
        callback('');
      }
    },
  },
};

describe('import', () => {
  describe('getCssWithExpandedImports', () => {
    it('correctly parses @import url(<url>)', async () => {
      const css = dedent`
        @import url(https://fonts.googleapis.com/css?family=Lato);

        a {
          color: red;
          font-family: Lato;
        }
      `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
        ${mockFontCss}

        a {
          color: red;
          font-family: Lato;
        }
      `);
    });

    it('correctly parses @import url("<url>")', async () => {
      const css = dedent`
        @import url("https://fonts.googleapis.com/css?family=Lato");

        a {
          color: red;
          font-family: Lato;
        }
      `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
        ${mockFontCss}

        a {
          color: red;
          font-family: Lato;
        }
      `);
    });

    it("correctly parses @import url('<url>')", async () => {
      const css = dedent`
        @import url('https://fonts.googleapis.com/css?family=Lato');

        a {
          color: red;
          font-family: Lato;
        }
      `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
        ${mockFontCss}

        a {
          color: red;
          font-family: Lato;
        }
      `);
    });

    it('correctly parses @import "<url>"', async () => {
      const css = dedent`
      @import "https://fonts.googleapis.com/css?family=Lato)";

      a {
        color: red;
        font-family: Lato;
      }
    `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
      ${mockFontCss}

      a {
        color: red;
        font-family: Lato;
      }
    `);
    });

    it('does not remove @import rule if unable to parse', async () => {
      // currently, we do not support media queries
      const css = dedent`
      @import "https://fonts.googleapis.com/css?family=Lato)" print;

      a {
        color: red;
        font-family: Lato;
      }
    `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
      @import "https://fonts.googleapis.com/css?family=Lato)" print;

      a {
        color: red;
        font-family: Lato;
      }
    `);
    });

    it('correctly returns css if there are no @import rules', async () => {
      const css = dedent`
      @font-face {
        font-family: 'Lato';
        font-style: normal;
      }

      a {
        color: red;
      }
    `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
      @font-face {
        font-family: 'Lato';
        font-style: normal;
      }

      a {
        color: red;
      }
    `);
    });

    it('correctly parses multiple @import rules', async () => {
      const css = dedent`
      @import "https://fonts.googleapis.com/css?family=Lato)";
      @import url(https://example2.css);

      a {
        color: red;
      }
    `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
      ${mockFontCss}

      ${mockExampleCss}

      a {
        color: red;
      }
    `);
    });

    it('correctly handles empty css from fetched @import rule', async () => {
      const css = dedent`
      @import "https://bad-url";

      a {
        color: red;
      }
    `;

      const output = await getCssWithExpandedImports(css);

      expect(output).toBe(dedent`
      a {
        color: red;
      }
    `);
    });
  });
});
