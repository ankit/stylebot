import { StylebotOptions } from '@stylebot/types';
import { defaultOptions } from '@stylebot/settings';

export const getAll = (): Promise<StylebotOptions> =>
  new Promise(resolve => {
    chrome.storage.local.get('options', items => {
      if (items['options']) {
        resolve(items['options']);
      } else {
        resolve(defaultOptions);
      }
    });
  });

export const get = async (
  name: keyof StylebotOptions
): Promise<StylebotOptions[keyof StylebotOptions]> => {
  const options = await getAll();
  return options[name];
};

export const set = async (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
): Promise<void> => {
  let options = await getAll();

  options = {
    ...options,
    [name]: value,
  };

  chrome.storage.local.set({ options });
};
