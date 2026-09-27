import {
  READABILITY_SETTINGS_KEY,
  getReadabilitySettings,
} from '@stylebot/settings';
import type { ReadabilitySettings, UpdateReader } from '@stylebot/types';

export const get = getReadabilitySettings;

export const set = async (value: ReadabilitySettings): Promise<void> => {
  await chrome.storage.local.set({ [READABILITY_SETTINGS_KEY]: value });

  const [tab] = await chrome.tabs.query({ active: true });

  if (tab?.url && tab.id) {
    const message: UpdateReader = {
      name: 'UpdateReader',
      value,
    };

    chrome.tabs.sendMessage(tab.id, message);
  }
};
