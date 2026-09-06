import { initReader } from './reader';
import { shouldRunOnUrl, isMediaWikiMainPage } from './heuristics';
import { showLoader, hideLoader } from './loader';
import { cacheUrl, didUrlChange, revertToCachedDocument } from './cache';

// Client-rendered pages can still be empty right after load — retry a few
// times before giving up, so hydration has a chance to finish.
export const RETRY_DELAYS_MS = [300, 600, 1200];

// Bumped on every apply()/remove() so a retry left over from a superseded
// attempt (e.g. the user toggled off while one was pending) is a no-op.
let generation = 0;

let pendingRetry: ReturnType<typeof setTimeout> | null = null;

const clearPendingRetry = (): void => {
  if (pendingRetry !== null) {
    clearTimeout(pendingRetry);
    pendingRetry = null;
  }
};

// Checked once when the DOM is ready, not retried like initReader()'s
// Mozilla heuristic — waiting longer won't change whether this is the
// wiki's main page, so retrying would just delay revealing the real page.
const startIfEligible = (myGeneration: number): void => {
  if (isMediaWikiMainPage()) {
    remove();
    return;
  }

  run(myGeneration);
};

const run = async (myGeneration: number, attempt = 0): Promise<void> => {
  if (myGeneration !== generation) {
    return;
  }

  try {
    await initReader();
  } catch (e) {
    if (myGeneration !== generation) {
      return;
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      pendingRetry = setTimeout(
        () => run(myGeneration, attempt + 1),
        RETRY_DELAYS_MS[attempt]
      );
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

  generation++;
  const myGeneration = generation;

  showLoader();

  // DOMContentLoaded only fires once, on the loading -> interactive
  // transition — attaching this listener after that point (e.g. toggled
  // mid-load) means it never fires, leaving the loader up forever.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startIfEligible(myGeneration);
    });
  } else {
    startIfEligible(myGeneration);
  }
};

// Kept in sync with the `.stylebot-reader.closing` transition duration.
const CLOSE_TRANSITION_MS = 250;

export const remove = (): void => {
  generation++;
  clearPendingRetry();
  hideLoader();
  revertToCachedDocument();

  const host = document.getElementById('stylebot-reader');
  const panel = host?.shadowRoot?.querySelector<HTMLElement>('.stylebot-reader');

  if (!panel) {
    host?.remove();
    return;
  }

  // The original page is already back underneath — fade the panel out
  // before detaching it instead of cutting away abruptly.
  panel.classList.add('closing');
  setTimeout(() => host?.remove(), CLOSE_TRANSITION_MS);
};
