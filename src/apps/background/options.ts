import type { StylebotOptions } from '@stylebot/types';
import { defaultOptions } from '@stylebot/settings';

/**
 * Layers stored options over the defaults so keys added in later releases
 * (e.g. `appearance`) resolve on profiles whose options predate them.
 */
export const getAll = async (): Promise<StylebotOptions> => {
  const items = await chrome.storage.local.get('options');
  return { ...defaultOptions, ...items['options'] };
};

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

    await chrome.storage.local.set({ options });
  });

  return pendingWrite;
};

/**
 * Drops stored keys that are no longer part of StylebotOptions so retired
 * options don't linger in storage.
 */
export const pruneRetired = (): Promise<void> => {
  pendingWrite = pendingWrite.then(async () => {
    const items = await chrome.storage.local.get('options');
    const stored = items['options'];
    if (!stored) {
      return;
    }

    const options = Object.fromEntries(
      Object.entries(stored).filter(([name]) => name in defaultOptions)
    );

    if (Object.keys(options).length !== Object.keys(stored).length) {
      await chrome.storage.local.set({ options });
    }
  });

  return pendingWrite;
};
