import { hideLoader } from '../loading-screen/loader';
import { revertToCachedDocument } from './document-cache';
import { reportChanged } from './report-changed';
import { nextGeneration, clearPendingRetry } from './state';

// Kept in sync with the `.stylebot-reader.closing` transition duration.
const CLOSE_TRANSITION_MS = 250;

/**
 * Tears down the reader and restores the original page.
 */
export const removeReadability = (): void => {
  nextGeneration();
  clearPendingRetry();
  hideLoader();
  revertToCachedDocument();

  const host = document.getElementById('stylebot-reader');
  const panel = host?.shadowRoot?.querySelector<HTMLElement>('.stylebot-reader');

  if (!panel) {
    host?.remove();
    reportChanged();
    return;
  }

  // The original page is already back underneath — fade the panel out
  // before detaching it instead of cutting away abruptly.
  panel.classList.add('closing');
  setTimeout(() => {
    host?.remove();
    reportChanged();
  }, CLOSE_TRANSITION_MS);
};
