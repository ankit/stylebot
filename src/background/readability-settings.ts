import { defaultReadabilitySettings } from '@stylebot/settings';
import { ReadabilitySettings, UpdateReader } from '@stylebot/types';

export const get = (): Promise<ReadabilitySettings> => {
  return new Promise(resolve => {
    chrome.storage.local.get('readability-settings', items => {
      const settings = items['readability-settings'];

      if (settings) {
        resolve(settings);
        return;
      }

      resolve(defaultReadabilitySettings);
    });
  });
};

export const set = (value: ReadabilitySettings): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.set({ 'readability-settings': value }, () => {
      resolve();

      // notify reader in current tab to update
      chrome.tabs.getSelected(tab => {
        if (tab && tab.url && tab.id) {
          const message: UpdateReader = {
            name: 'UpdateReader',
            value,
          };

          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    });
  });
};
