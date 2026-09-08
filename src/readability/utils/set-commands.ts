import { SetCommands, StylebotCommands } from '@stylebot/types';

/**
 * Persists the user's Stylebot keyboard shortcuts to the background.
 */
export const setCommands = (value: StylebotCommands): void => {
  const message: SetCommands = { name: 'SetCommands', value };
  chrome.runtime.sendMessage(message);
};
