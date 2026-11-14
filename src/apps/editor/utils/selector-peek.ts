import { getPageBridge } from '@stylebot/page-bridge';

const PEEK_DURATION = 800;

let peekTimer: number | null = null;

/**
 * Boxes what a newly chosen selector matches for a moment, then clears it
 * unless `keep` says something else is still showing the same selector.
 */
export const peekSelectorMatches = (
  selector: string,
  keep: () => boolean
): void => {
  stopPeek();
  getPageBridge().highlight(selector);

  peekTimer = window.setTimeout(() => {
    peekTimer = null;

    if (!keep()) {
      getPageBridge().unhighlight();
    }
  }, PEEK_DURATION);
};

/**
 * Cancels a running peek, leaving whatever it drew for the caller to clear.
 */
export const stopPeek = (): void => {
  if (peekTimer !== null) {
    window.clearTimeout(peekTimer);
    peekTimer = null;
  }
};

export const isPeeking = (): boolean => peekTimer !== null;
