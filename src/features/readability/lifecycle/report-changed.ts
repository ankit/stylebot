import type { ReadabilityActiveChanged } from '@stylebot/types';

/**
 * Tells the background the reader opened or closed, for the toolbar badge.
 */
export const reportChanged = (): void => {
  const message: ReadabilityActiveChanged = {
    name: 'ReadabilityActiveChanged',
  };

  chrome.runtime.sendMessage(message);
};
