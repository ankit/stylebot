import { mountReader } from './mount-reader';
import {
  shouldRunOnUrl,
  shouldWaitForFullLoad,
  isBlockedAfterLoad,
} from '../eligibility';
import { showLoader } from '../loading-screen/loader';
import { cacheUrl, didUrlChange } from './document-cache';
import { removeReadability } from './remove-readability';
import { reportChanged } from './report-changed';
import { nextGeneration, isStaleGeneration, setPendingRetry } from './state';

// Client-rendered pages can still be empty right after load — retry a few
// times before giving up, so hydration has a chance to finish.
export const RETRY_DELAYS_MS = [300, 600, 1200];

/**
 * Checked once, not retried like mountReader()'s heuristic — more waiting
 * won't change the answer for any of these checks.
 */
const startIfEligible = (myGeneration: number): void => {
  if (isBlockedAfterLoad()) {
    removeReadability();
    return;
  }

  run(myGeneration);
};

/**
 * Attempts to mount the reader, retrying on failure up to RETRY_DELAYS_MS.
 */
const run = async (myGeneration: number, attempt = 0): Promise<void> => {
  if (isStaleGeneration(myGeneration)) {
    return;
  }

  try {
    await mountReader();
    reportChanged();
  } catch (e) {
    if (isStaleGeneration(myGeneration)) {
      return;
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      setPendingRetry(
        setTimeout(() => run(myGeneration, attempt + 1), RETRY_DELAYS_MS[attempt])
      );
    } else {
      removeReadability();
    }
  }
};

/**
 * Mounts the reader on the current page, showing a themed loader while it works.
 */
export const applyReadability = async (forceApply = false): Promise<void> => {
  if (window !== window.top) {
    return;
  }

  // Prevent duplicate calls for the same url if not force applying
  if (!forceApply && !didUrlChange()) {
    return;
  }

  cacheUrl();

  if (!shouldRunOnUrl()) {
    removeReadability();
    return;
  }

  const myGeneration = nextGeneration();

  showLoader();

  scheduleStart(myGeneration);
};

// Ceiling on the deferred-parse wait: if a stray resource never resolves,
// parse anyway rather than leaving the themed loader up indefinitely.
const FULL_LOAD_TIMEOUT_MS = 5000;

/**
 * Waits for the right load signal (DOMContentLoaded, or full `load` on
 * lazy-image sites) before checking eligibility and starting the mount.
 */
const scheduleStart = (myGeneration: number): void => {
  // Lazy-image sites: wait for window `load` so real srcs have resolved.
  if (shouldWaitForFullLoad()) {
    if (document.readyState === 'complete') {
      startIfEligible(myGeneration);
      return;
    }

    let started = false;
    const start = (): void => {
      if (started) {
        return;
      }
      started = true;
      startIfEligible(myGeneration);
    };

    const timeout = setTimeout(start, FULL_LOAD_TIMEOUT_MS);
    window.addEventListener(
      'load',
      () => {
        clearTimeout(timeout);
        start();
      },
      { once: true }
    );
    return;
  }

  // DOMContentLoaded fires once; attach only while still loading.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startIfEligible(myGeneration);
    });
  } else {
    startIfEligible(myGeneration);
  }
};
