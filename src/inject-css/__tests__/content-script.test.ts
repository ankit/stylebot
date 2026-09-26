/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CompiledStyles } from '@stylebot/types';

jest.mock('../apply-state');
jest.mock('../cache');
jest.mock('../hide-page');
jest.mock('../import-cache');
jest.mock('@stylebot/styles', () => ({
  ...jest.requireActual('@stylebot/styles'),
  getStylesForPage: jest.fn(),
}));
jest.mock('@stylebot/readability');

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const REVISION = '2026-09-25T00:00:00.000Z';

const compiledStyles = (
  overrides: Partial<CompiledStyles> = {}
): CompiledStyles => ({
  version: 1,
  revision: REVISION,
  styles: {
    a: { css: '.a{}', importUrls: [], enabled: true, readability: false },
  },
  ...overrides,
});

describe('inject-css run()', () => {
  let applyStateModule: typeof import('../apply-state');
  let cacheModule: typeof import('../cache');
  let hidePageModule: typeof import('../hide-page');
  let importCacheModule: typeof import('../import-cache');
  let stylesModule: typeof import('@stylebot/styles');
  let sendMessage: jest.Mock;
  let registeredListener: (
    message: { name: string },
    sender: unknown,
    sendResponse: (response: boolean) => void
  ) => void;

  beforeEach(() => {
    jest.resetModules();

    applyStateModule = require('../apply-state');
    cacheModule = require('../cache');
    hidePageModule = require('../hide-page');
    importCacheModule = require('../import-cache');
    stylesModule = require('@stylebot/styles');

    sendMessage = jest.fn();

    (global as any).chrome = {
      storage: { local: { get: jest.fn() } },
      runtime: {
        sendMessage,
        onMessage: {
          addListener: (fn: typeof registeredListener) => {
            registeredListener = fn;
          },
        },
      },
    };
  });

  // null stands for nothing stored, since undefined would pick the default.
  const load = (
    stored: CompiledStyles | null = compiledStyles(),
    revision = REVISION
  ) => {
    ((global as any).chrome.storage.local.get as jest.Mock).mockResolvedValue({
      'styles-compiled': stored ?? undefined,
      'styles-metadata': { modifiedTime: revision },
    });

    require('../content-script');
  };

  const matching = (
    styles: Array<Record<string, unknown>>,
    defaultStyle?: Record<string, unknown>
  ) =>
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles,
      defaultStyle,
    });

  it('hides the page and applies the fresh state when there is no cache', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    matching([{ url: 'a', css: '.a{}', importUrls: [], enabled: true }]);

    load();
    await flushPromises();

    const expectedState = {
      styles: [{ url: 'a', css: '.a{}', importUrls: [], enabled: true }],
      readability: false,
    };

    expect(hidePageModule.hidePage).toHaveBeenCalledTimes(1);
    expect(applyStateModule.applyState).toHaveBeenCalledWith(expectedState);
    expect(cacheModule.writeCache).toHaveBeenCalledWith(expectedState);
    expect(hidePageModule.revealPage).toHaveBeenCalledTimes(1);
  });

  it('matches the page against the stored compiled styles when they are current', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    matching([]);

    const stored = compiledStyles();
    load(stored);
    await flushPromises();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(stylesModule.getStylesForPage).toHaveBeenCalledWith(
      window.location.href,
      stored.styles
    );
  });

  it.each([
    ['missing', null, REVISION],
    ['built from other styles', compiledStyles(), 'a-later-revision'],
    ['from an older compiler', compiledStyles({ version: 0 }), REVISION],
  ])(
    'asks the background for the compiled styles when the stored copy is %s',
    async (_label, stored, revision) => {
      (cacheModule.readCache as jest.Mock).mockReturnValue(null);
      matching([]);

      const rebuilt = compiledStyles({ revision });
      sendMessage.mockResolvedValue(rebuilt);

      load(stored, revision);
      await flushPromises();

      expect(sendMessage).toHaveBeenCalledWith({ name: 'GetCompiledStyles' });
      expect(stylesModule.getStylesForPage).toHaveBeenCalledWith(
        window.location.href,
        rebuilt.styles
      );
    }
  );

  it('applies the cache immediately, without hiding, when there is one', () => {
    const cached = {
      styles: [{ url: 'a', css: '.a{}', importUrls: [], enabled: true }],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    matching([]);

    load();

    expect(hidePageModule.hidePage).not.toHaveBeenCalled();
    expect(applyStateModule.applyState).toHaveBeenCalledWith(cached);
  });

  it('does not re-apply when the fresh state matches the cache', async () => {
    const cached = {
      styles: [{ url: 'a', css: '.a{}', importUrls: [], enabled: true }],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    matching([{ url: 'a', css: '.a{}', importUrls: [], enabled: true }]);

    load();
    await flushPromises();

    // Only the initial cache-hit application — nothing patched afterwards.
    expect(applyStateModule.applyState).toHaveBeenCalledTimes(1);
    expect(hidePageModule.revealPage).toHaveBeenCalledTimes(1);
  });

  it('patches to the fresh state when it differs from a stale cache', async () => {
    const cached = {
      styles: [
        { url: 'a', css: '.a{color:old}', importUrls: [], enabled: true },
      ],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    matching([
      { url: 'a', css: '.a{color:new}', importUrls: [], enabled: true },
    ]);

    load();
    await flushPromises();

    const freshState = {
      styles: [
        { url: 'a', css: '.a{color:new}', importUrls: [], enabled: true },
      ],
      readability: false,
    };

    expect(applyStateModule.applyState).toHaveBeenNthCalledWith(1, cached);
    expect(applyStateModule.applyState).toHaveBeenNthCalledWith(2, freshState);
    expect(cacheModule.writeCache).toHaveBeenCalledWith(freshState);
  });

  it('keeps only the @import responses the page still uses in the cache', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    matching([
      {
        url: 'a',
        css: '.a{}',
        importUrls: ['https://x.test/a.css'],
        enabled: true,
      },
    ]);

    load();
    await flushPromises();

    expect(importCacheModule.pruneImportCache).toHaveBeenCalledWith(
      new Set(['https://x.test/a.css'])
    );
  });

  it('reads readability off the matched default style', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    matching([], { url: '*', readability: true });

    load();
    await flushPromises();

    expect(applyStateModule.applyState).toHaveBeenCalledWith({
      styles: [],
      readability: true,
    });
  });

  it('answers GetIsReadabilityActive based on whether #stylebot-reader is mounted', () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    matching([]);

    load();

    const sendResponse = jest.fn();
    registeredListener({ name: 'GetIsReadabilityActive' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenLastCalledWith(false);

    const host = document.createElement('div');
    host.id = 'stylebot-reader';
    document.body.appendChild(host);

    registeredListener({ name: 'GetIsReadabilityActive' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenLastCalledWith(true);

    host.remove();
  });
});
