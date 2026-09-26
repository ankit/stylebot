/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CompiledStyles } from '@stylebot/types';

jest.mock('../stylesheet');
jest.mock('@stylebot/readability');

const REVISION = '2026-09-26T00:00:00.000Z';

const compiled = (styles: CompiledStyles['styles']): CompiledStyles => ({
  version: 1,
  revision: REVISION,
  styles,
});

describe('reapplySavedStyles', () => {
  let stylesheet: typeof import('../stylesheet');
  let cache: typeof import('../cache');
  let reapplySavedStyles: typeof import('../saved-styles').reapplySavedStyles;

  const store = (stored: CompiledStyles) => {
    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({
            'styles-compiled': stored,
            'styles-metadata': { modifiedTime: REVISION },
          }),
        },
      },
      runtime: { sendMessage: jest.fn() },
    };
  };

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();

    stylesheet = require('../stylesheet');
    cache = require('../cache');
    ({ reapplySavedStyles } = require('../saved-styles'));
  });

  it("injects the page's saved styles and caches them for the next load", async () => {
    store(
      compiled({
        localhost: {
          css: 'a { color: red !important; }',
          importUrls: [],
          enabled: true,
          readability: false,
        },
      })
    );

    await reapplySavedStyles();

    expect(stylesheet.injectStylesheet).toHaveBeenCalledWith(
      'localhost',
      'a { color: red !important; }',
      []
    );
    expect(cache.readCache()?.styles).toEqual([
      {
        url: 'localhost',
        css: 'a { color: red !important; }',
        importUrls: [],
        enabled: true,
      },
    ]);
  });

  it('removes a style the cache had applied that storage no longer has', async () => {
    cache.writeCache({
      styles: [{ url: 'localhost', css: 'a{}', importUrls: [], enabled: true }],
      readability: false,
    });
    store(compiled({}));

    await reapplySavedStyles();

    expect(stylesheet.removeStylesheet).toHaveBeenCalledWith('localhost');
    expect(cache.readCache()?.styles).toEqual([]);
  });
});
