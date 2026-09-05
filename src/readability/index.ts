import { initReader } from './reader';
import { shouldRunOnUrl, isReaderable } from './utils';
import { showLoader, hideLoader } from './loader';
import { cacheUrl, didUrlChange, revertToCachedDocument } from './cache';

import './index.scss';

// Client-rendered pages can still be empty at this point — retry a few
// times before giving up, so hydration has a chance to finish.
const RETRY_DELAYS_MS = [300, 600, 1200];

let clobberObserver: MutationObserver | null = null;

const stopWatchingForClobbering = (): void => {
  clobberObserver?.disconnect();
  clobberObserver = null;
};

// Some client-hydrated pages wipe body's children during a reconciliation
// pass that runs after we've already mounted — re-apply if that happens,
// rather than leaving the tab on the stripped-down original page.
const watchForClobbering = (attempt: number): void => {
  if (attempt >= RETRY_DELAYS_MS.length) {
    return;
  }

  clobberObserver = new MutationObserver(() => {
    if (!document.getElementById('stylebot-reader')) {
      stopWatchingForClobbering();
      run(attempt + 1);
    }
  });
  clobberObserver.observe(document.body, { childList: true });

  setTimeout(stopWatchingForClobbering, 5000);
};

const run = async (attempt = 0): Promise<void> => {
  try {
    await initReader();
    watchForClobbering(attempt);
  } catch (e) {
    if (attempt < RETRY_DELAYS_MS.length) {
      setTimeout(() => run(attempt + 1), RETRY_DELAYS_MS[attempt]);
    } else {
      remove();
    }
  }
};

export const apply = async (forceApply = false): Promise<void> => {
  if (window !== window.top) {
    return;
  }

  // Prevent duplicate calls for the same url if not force applying
  if (!forceApply && !didUrlChange()) {
    return;
  }

  cacheUrl();

  if (!shouldRunOnUrl()) {
    remove();
    return;
  }

  showLoader();

  // DOMContentLoaded only fires once, on the loading -> interactive
  // transition — attaching this listener after that point (e.g. toggled
  // mid-load) means it never fires, leaving the loader up forever.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      run();
    });
  } else {
    run();
  }
};

export const remove = (): void => {
  stopWatchingForClobbering();
  hideLoader();
  revertToCachedDocument();
  document.getElementById('stylebot-reader')?.remove();
};

export { isReaderable };
