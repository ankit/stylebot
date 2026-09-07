export {};

jest.mock('../mount-reader');
jest.mock('../../eligibility/should-run-on-url');
jest.mock('../../eligibility/should-wait-for-full-load');
jest.mock('../../eligibility/is-blocked-after-load');
jest.mock('../../loading-screen/loader');
jest.mock('../document-cache');

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('applyReadability()/removeReadability()', () => {
  let mountReaderModule: typeof import('../mount-reader');
  let shouldRunOnUrlModule: typeof import('../../eligibility/should-run-on-url');
  let isBlockedAfterLoadModule: typeof import('../../eligibility/is-blocked-after-load');
  let loaderModule: typeof import('../../loading-screen/loader');
  let documentCacheModule: typeof import('../document-cache');
  let applyReadability: typeof import('../apply-readability').applyReadability;
  let removeReadability: typeof import('../remove-readability').removeReadability;

  const setReadyState = (value: DocumentReadyState) => {
    Object.defineProperty(document, 'readyState', {
      value,
      configurable: true,
    });
  };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    global.chrome = {
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;

    mountReaderModule = require('../mount-reader');
    shouldRunOnUrlModule = require('../../eligibility/should-run-on-url');
    isBlockedAfterLoadModule = require('../../eligibility/is-blocked-after-load');
    loaderModule = require('../../loading-screen/loader');
    documentCacheModule = require('../document-cache');

    (documentCacheModule.didUrlChange as jest.Mock).mockReturnValue(true);
    (shouldRunOnUrlModule.shouldRunOnUrl as jest.Mock).mockReturnValue(true);
    (mountReaderModule.mountReader as jest.Mock).mockResolvedValue(undefined);

    setReadyState('complete');

    ({ applyReadability } = require('../apply-readability'));
    ({ removeReadability } = require('../remove-readability'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when the url has not changed and forceApply is false', async () => {
    (documentCacheModule.didUrlChange as jest.Mock).mockReturnValue(false);

    await applyReadability();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();
  });

  it('reverts and skips mounting when the url should not run', async () => {
    (shouldRunOnUrlModule.shouldRunOnUrl as jest.Mock).mockReturnValue(false);

    await applyReadability();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
  });

  it('shows the loader and mounts immediately when the document is already ready', async () => {
    await applyReadability();
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('waits for DOMContentLoaded before mounting when the document is still loading', async () => {
    setReadyState('loading');

    await applyReadability();
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('reverts immediately without retrying when blocked after load', async () => {
    (isBlockedAfterLoadModule.isBlockedAfterLoad as jest.Mock).mockReturnValue(true);

    await applyReadability();
    await flushPromises();

    expect(mountReaderModule.mountReader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
  });

  it('retries a bounded number of times before giving up', async () => {
    (mountReaderModule.mountReader as jest.Mock).mockRejectedValue(undefined);

    await applyReadability();
    await flushPromises();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);

    // Exhaust every retry delay.
    for (let i = 0; i < 3; i++) {
      jest.runOnlyPendingTimers();
      await flushPromises();
    }

    expect(mountReaderModule.mountReader).toBeCalledTimes(4); // initial attempt + 3 retries
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
  });

  it('cancels a pending retry when readability is turned off in the meantime', async () => {
    (mountReaderModule.mountReader as jest.Mock).mockRejectedValueOnce(undefined);

    await applyReadability();
    await flushPromises();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);

    // The failed attempt scheduled a retry — turn readability off before it fires.
    removeReadability();

    jest.runOnlyPendingTimers();
    await flushPromises();

    // The stale retry must not re-run mountReader after the user turned it off.
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });
});
