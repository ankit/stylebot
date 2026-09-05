export {};

jest.mock('../reader');
jest.mock('../utils');
jest.mock('../loader');
jest.mock('../cache');

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('readability apply()/remove()', () => {
  let readerModule: typeof import('../reader');
  let utilsModule: typeof import('../utils');
  let loaderModule: typeof import('../loader');
  let cacheModule: typeof import('../cache');
  let apply: typeof import('../apply').apply;
  let remove: typeof import('../apply').remove;

  const setReadyState = (value: DocumentReadyState) => {
    Object.defineProperty(document, 'readyState', {
      value,
      configurable: true,
    });
  };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    readerModule = require('../reader');
    utilsModule = require('../utils');
    loaderModule = require('../loader');
    cacheModule = require('../cache');

    (cacheModule.didUrlChange as jest.Mock).mockReturnValue(true);
    (utilsModule.shouldRunOnUrl as jest.Mock).mockReturnValue(true);
    (readerModule.initReader as jest.Mock).mockResolvedValue(undefined);

    setReadyState('complete');

    ({ apply, remove } = require('../apply'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when the url has not changed and forceApply is false', async () => {
    (cacheModule.didUrlChange as jest.Mock).mockReturnValue(false);

    await apply();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(readerModule.initReader).not.toBeCalled();
  });

  it('reverts and skips mounting when the url should not run', async () => {
    (utilsModule.shouldRunOnUrl as jest.Mock).mockReturnValue(false);

    await apply();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(cacheModule.revertToCachedDocument).toBeCalled();
  });

  it('shows the loader and mounts immediately when the document is already ready', async () => {
    await apply();
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(readerModule.initReader).toBeCalledTimes(1);
  });

  it('waits for DOMContentLoaded before mounting when the document is still loading', async () => {
    setReadyState('loading');

    await apply();
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(readerModule.initReader).not.toBeCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    expect(readerModule.initReader).toBeCalledTimes(1);
  });

  it('retries a bounded number of times before giving up', async () => {
    (readerModule.initReader as jest.Mock).mockRejectedValue(undefined);

    await apply();
    await flushPromises();
    expect(readerModule.initReader).toBeCalledTimes(1);

    // Exhaust every retry delay.
    for (let i = 0; i < 3; i++) {
      jest.runOnlyPendingTimers();
      await flushPromises();
    }

    expect(readerModule.initReader).toBeCalledTimes(4); // initial attempt + 3 retries
    expect(loaderModule.hideLoader).toBeCalled();
    expect(cacheModule.revertToCachedDocument).toBeCalled();
  });

  it('cancels a pending retry when readability is turned off in the meantime', async () => {
    (readerModule.initReader as jest.Mock).mockRejectedValueOnce(undefined);

    await apply();
    await flushPromises();
    expect(readerModule.initReader).toBeCalledTimes(1);

    // The failed attempt scheduled a retry — turn readability off before it fires.
    remove();

    jest.runOnlyPendingTimers();
    await flushPromises();

    // The stale retry must not re-run initReader after the user turned it off.
    expect(readerModule.initReader).toBeCalledTimes(1);
  });
});
