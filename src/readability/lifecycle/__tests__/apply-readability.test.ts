import { setImmediate } from 'timers';

jest.mock('../mount-reader');
jest.mock('../load-reader');
jest.mock('../../eligibility/should-run-on-url');
jest.mock('../../eligibility/should-wait-for-full-load');
jest.mock('../../eligibility/is-blocked-after-load');
jest.mock('../../loading-screen/loader');
jest.mock('../document-cache');
jest.mock('../eligibility-cache');

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('applyReadability()', () => {
  let mountReaderModule: typeof import('../mount-reader');
  let loadReaderModule: typeof import('../load-reader');
  let shouldRunOnUrlModule: typeof import('../../eligibility/should-run-on-url');
  let isBlockedAfterLoadModule: typeof import('../../eligibility/is-blocked-after-load');
  let loaderModule: typeof import('../../loading-screen/loader');
  let documentCacheModule: typeof import('../document-cache');
  let eligibilityCacheModule: typeof import('../eligibility-cache');
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
    loadReaderModule = require('../load-reader');
    shouldRunOnUrlModule = require('../../eligibility/should-run-on-url');
    isBlockedAfterLoadModule = require('../../eligibility/is-blocked-after-load');
    loaderModule = require('../../loading-screen/loader');
    documentCacheModule = require('../document-cache');
    eligibilityCacheModule = require('../eligibility-cache');

    (documentCacheModule.didUrlChange as jest.Mock).mockReturnValue(true);
    (shouldRunOnUrlModule.shouldRunOnUrl as jest.Mock).mockReturnValue(true);
    (mountReaderModule.mountReader as jest.Mock).mockResolvedValue(undefined);
    (loadReaderModule.loadReader as jest.Mock).mockResolvedValue(
      mountReaderModule.mountReader
    );
    (eligibilityCacheModule.getEligibility as jest.Mock).mockReturnValue({
      isKnownIneligible: false,
      matchesKnownPattern: false,
    });

    setReadyState('complete');

    ({ applyReadability } = require('../apply-readability'));
    ({ removeReadability } = require('../remove-readability'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should do nothing when the url has not changed and forceApply is false', async () => {
    (documentCacheModule.didUrlChange as jest.Mock).mockReturnValue(false);

    await applyReadability();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();
  });

  it('should revert and skip mounting when the url should not run', async () => {
    (shouldRunOnUrlModule.shouldRunOnUrl as jest.Mock).mockReturnValue(false);

    await applyReadability();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
  });

  it('should attempt silently, without the loader, when nothing is known about the url', async () => {
    await applyReadability();
    await flushPromises();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('should mark the url eligible once mounting succeeds', async () => {
    await applyReadability();
    await flushPromises();

    expect(eligibilityCacheModule.markEligible).toBeCalledWith(
      window.location.href
    );
  });

  it('should show the loader when the url matches a pattern already learned for this origin', async () => {
    (eligibilityCacheModule.getEligibility as jest.Mock).mockReturnValue({
      isKnownIneligible: false,
      matchesKnownPattern: true,
    });

    await applyReadability();
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('should show the loader for a forced apply even with no known pattern', async () => {
    await applyReadability(true);
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('should skip the attempt entirely when the url was already found ineligible', async () => {
    (eligibilityCacheModule.getEligibility as jest.Mock).mockReturnValue({
      isKnownIneligible: true,
      matchesKnownPattern: false,
    });

    await applyReadability();

    expect(loaderModule.showLoader).not.toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
  });

  it('should still attempt a forced apply even when the url was found ineligible before', async () => {
    (eligibilityCacheModule.getEligibility as jest.Mock).mockReturnValue({
      isKnownIneligible: true,
      matchesKnownPattern: false,
    });

    await applyReadability(true);
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('should wait for DOMContentLoaded before mounting when the document is still loading', async () => {
    setReadyState('loading');

    await applyReadability(true);
    await flushPromises();

    expect(loaderModule.showLoader).toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    expect(mountReaderModule.mountReader).toBeCalledTimes(1);
  });

  it('should start loading the reader before the document has loaded', async () => {
    setReadyState('loading');

    await applyReadability(true);

    expect(loadReaderModule.loadReader).toBeCalled();
    expect(mountReaderModule.mountReader).not.toBeCalled();
  });

  it('should revert without marking the url ineligible when the reader fails to load', async () => {
    (loadReaderModule.loadReader as jest.Mock).mockRejectedValue(
      new Error('load failed')
    );

    await applyReadability(true);
    await flushPromises();

    expect(mountReaderModule.mountReader).not.toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
    expect(eligibilityCacheModule.markIneligible).not.toBeCalled();
  });

  it('should revert immediately without retrying when blocked after load', async () => {
    (isBlockedAfterLoadModule.isBlockedAfterLoad as jest.Mock).mockReturnValue(
      true
    );

    await applyReadability();
    await flushPromises();

    expect(mountReaderModule.mountReader).not.toBeCalled();
    expect(loaderModule.hideLoader).toBeCalled();
    expect(documentCacheModule.revertToCachedDocument).toBeCalled();
    expect(eligibilityCacheModule.markIneligible).toBeCalledWith(
      window.location.href
    );
  });

  it('should retry a bounded number of times before giving up', async () => {
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
    expect(eligibilityCacheModule.markIneligible).toBeCalledWith(
      window.location.href
    );
  });

  it('should cancel a pending retry when readability is turned off in the meantime', async () => {
    (mountReaderModule.mountReader as jest.Mock).mockRejectedValueOnce(
      undefined
    );

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
