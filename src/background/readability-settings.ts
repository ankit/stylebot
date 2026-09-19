import { defaultReadabilitySettings } from '@stylebot/settings';
import { ReadabilitySettings, UpdateReader } from '@stylebot/types';

export const get = async (): Promise<ReadabilitySettings> => {
  const items = await chrome.storage.local.get('readability-settings');
  return items['readability-settings'] || defaultReadabilitySettings;
};

export const set = async (value: ReadabilitySettings): Promise<void> => {
  await chrome.storage.local.set({ 'readability-settings': value });

  const [tab] = await chrome.tabs.query({ active: true });

  if (tab?.url && tab.id) {
    const message: UpdateReader = {
      name: 'UpdateReader',
      value,
    };

    chrome.tabs.sendMessage(tab.id, message);
  }
};
