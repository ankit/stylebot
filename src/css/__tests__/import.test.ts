/* eslint-disable @typescript-eslint/no-explicit-any */

const dedent = require('dedent');
import {
  extractImports,
  fetchImportCss,
  getCssWithExpandedImports,
  pruneImportCache,
} from '../import';

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
    sendMessage: (message: any) => {
      if (message.url === 'https://fonts.googleapis.com/css?family=Lato') {
        return Promise.resolve(mockFontCss);
      }

      if (message.url === 'https://example2.css') {
        return Promise.resolve(mockExampleCss);
      }

      return Promise.resolve('');
    },
  },
} as unknown as typeof chrome;

describe('import', () => {
  afterEach(() => {
    localStorage.clear();
  });

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

    it('keeps nested rules intact after extracting the @import', async () => {
      const css = dedent`
      @import url(https://fonts.googleapis.com/css?family=Lato);

      .card {
        font-family: Lato;
        & + & {
          margin-top: 8px;
        }
        @media (min-width: 600px) {
          .title {
            color: red;
          }
        }
      }
    `;

      expect(extractImports(css)).toEqual({
        importUrls: ['https://fonts.googleapis.com/css?family=Lato'],
        css: dedent`
        .card {
          font-family: Lato;
          & + & {
            margin-top: 8px;
          }
          @media (min-width: 600px) {
            .title {
              color: red;
            }
          }
        }
      `,
      });
    });
  });

  describe('fetchImportCss', () => {
    const originalSendMessage = global.chrome.runtime.sendMessage;

    afterEach(() => {
      global.chrome.runtime.sendMessage = originalSendMessage;
    });

    it('fetches and caches the response when nothing is cached', async () => {
      const sendMessage = jest.fn((_message: any) =>
        Promise.resolve('.a{color:red}')
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/a.css');

      expect(result).toBe('.a{color:red}');
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(
        localStorage.getItem('stylebot-import-cache:https://example.com/a.css')
      ).toBe('.a{color:red}');
    });

    it('resolves from the cache without waiting on the fetch to complete', async () => {
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/a.css',
        '.cached{}'
      );

      let deliver: (response: string) => void = () => undefined;
      const sendMessage = jest.fn(
        (_message: any) =>
          new Promise<string>(resolve => {
            deliver = resolve;
          })
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/a.css');

      expect(result).toBe('.cached{}');
      // still refreshes the cache in the background
      expect(sendMessage).toHaveBeenCalledTimes(1);

      deliver('.fresh{}');
    });

    it('resolves empty and does not cache if the background is unreachable', async () => {
      const sendMessage = jest.fn((_message: any) =>
        Promise.reject(new Error('Could not establish connection.'))
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/down.css');

      expect(result).toBe('');
      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/down.css'
        )
      ).toBeNull();
    });

    it('does not cache an empty response', async () => {
      const sendMessage = jest.fn((_message: any) => Promise.resolve(''));
      global.chrome.runtime.sendMessage = sendMessage as any;

      await fetchImportCss('https://example.com/missing.css');

      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/missing.css'
        )
      ).toBeNull();
    });
  });

  describe('pruneImportCache', () => {
    it('removes cache entries for urls that are no longer live', () => {
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/still-used.css',
        '.a{}'
      );
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/removed.css',
        '.b{}'
      );

      pruneImportCache(new Set(['https://example.com/still-used.css']));

      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/still-used.css'
        )
      ).toBe('.a{}');
      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/removed.css'
        )
      ).toBeNull();
    });

    it('leaves unrelated localStorage keys alone', () => {
      localStorage.setItem('some-other-key', 'value');

      pruneImportCache(new Set());

      expect(localStorage.getItem('some-other-key')).toBe('value');
    });
  });
});
