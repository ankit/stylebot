import { ReadabilityActiveChanged } from '@stylebot/types';

/**
 * Tells the background to refresh the badge — carries no state itself,
 * it re-queries the live DOM instead of trusting a passed value.
 */
export const reportChanged = (): void => {
  const message: ReadabilityActiveChanged = { name: 'ReadabilityActiveChanged' };
  chrome.runtime.sendMessage(message);
};
