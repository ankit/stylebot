/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('../apply-state');
jest.mock('../cache');
jest.mock('../hide-page');
jest.mock('@stylebot/styles');
jest.mock('@stylebot/readability');

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('inject-css run()', () => {
  let applyStateModule: typeof import('../apply-state');
  let cacheModule: typeof import('../cache');
  let hidePageModule: typeof import('../hide-page');
  let stylesModule: typeof import('@stylebot/styles');

  beforeEach(() => {
    jest.resetModules();

    applyStateModule = require('../apply-state');
    cacheModule = require('../cache');
    hidePageModule = require('../hide-page');
    stylesModule = require('@stylebot/styles');

    (applyStateModule.applyState as jest.Mock).mockResolvedValue(undefined);

    (global as any).chrome = {
      storage: { local: { get: jest.fn() } },
      runtime: { onMessage: { addListener: jest.fn() } },
    };
  });

  const load = (storedItems: Record<string, unknown>) => {
    (
      (global as any).chrome.storage.local.get as jest.Mock
    ).mockImplementation((_key: string, callback: (items: unknown) => void) =>
      callback(storedItems)
    );

    require('../index');
  };

  it('hides the page and applies the fresh state when there is no cache', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      defaultStyle: undefined,
    });

    load({ styles: {} });
    await flushPromises();

    const expectedState = {
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    };

    expect(hidePageModule.hidePage).toHaveBeenCalledTimes(1);
    expect(applyStateModule.applyState).toHaveBeenCalledWith(expectedState);
    expect(cacheModule.writeCache).toHaveBeenCalledWith(expectedState);
    expect(hidePageModule.revealPage).toHaveBeenCalledTimes(1);
  });

  it('applies the cache immediately, without hiding, when there is one', async () => {
    const cached = {
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      defaultStyle: undefined,
    });

    load({ styles: {} });

    expect(hidePageModule.hidePage).not.toHaveBeenCalled();
    expect(applyStateModule.applyState).toHaveBeenCalledWith(cached);
  });

  it('does not re-apply when the fresh state matches the cache', async () => {
    const cached = {
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [{ url: 'a', css: '.a{}', enabled: true }],
      defaultStyle: undefined,
    });

    load({ styles: {} });
    await flushPromises();

    // Only the initial cache-hit application — nothing patched afterwards.
    expect(applyStateModule.applyState).toHaveBeenCalledTimes(1);
    expect(hidePageModule.revealPage).toHaveBeenCalledTimes(1);
  });

  it('patches to the fresh state when it differs from a stale cache', async () => {
    const cached = {
      styles: [{ url: 'a', css: '.a{color:old}', enabled: true }],
      readability: false,
    };

    (cacheModule.readCache as jest.Mock).mockReturnValue(cached);
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [{ url: 'a', css: '.a{color:new}', enabled: true }],
      defaultStyle: undefined,
    });

    load({ styles: {} });
    await flushPromises();

    const freshState = {
      styles: [{ url: 'a', css: '.a{color:new}', enabled: true }],
      readability: false,
    };

    expect(applyStateModule.applyState).toHaveBeenNthCalledWith(1, cached);
    expect(applyStateModule.applyState).toHaveBeenNthCalledWith(
      2,
      freshState
    );
    expect(cacheModule.writeCache).toHaveBeenCalledWith(freshState);
  });

  it('reads readability off the matched default style', async () => {
    (cacheModule.readCache as jest.Mock).mockReturnValue(null);
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [],
      defaultStyle: { url: '*', readability: true },
    });

    load({ styles: {} });
    await flushPromises();

    expect(applyStateModule.applyState).toHaveBeenCalledWith({
      styles: [],
      readability: true,
    });
  });
});
