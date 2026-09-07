import { ReadabilitySettings, SetReadabilitySettings } from '@stylebot/types';

/**
 * Persists the reader's typography/theme settings to the background.
 */
export const sendReadabilitySettings = (value: ReadabilitySettings): void => {
  const message: SetReadabilitySettings = {
    name: 'SetReadabilitySettings',
    value,
  };
  chrome.runtime.sendMessage(message);
};
