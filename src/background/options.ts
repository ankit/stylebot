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

/**
 * Chains writes so each set() reads options only after the prior one
 * finished, preventing concurrent writes from clobbering each other.
 */
let pendingWrite = Promise.resolve();

export const set = (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
): Promise<void> => {
  pendingWrite = pendingWrite.then(async () => {
    const options = {
      ...(await getAll()),
      [name]: value,
    };

    await new Promise<void>(resolve => {
      chrome.storage.local.set({ options }, resolve);
    });
  });

  return pendingWrite;
};
