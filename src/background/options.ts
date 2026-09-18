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
 * Chains every write onto the previous one so a set() call always reads
 * options *after* the prior set() has finished writing. Without this,
 * concurrent SetOption messages (e.g. rapid layout updates while dragging
 * the resize handle) can each read the same stale snapshot and the last
 * write to land clobbers an unrelated field changed in between, such as
 * silently reverting the editor mode the user just picked.
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
