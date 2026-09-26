import type { ReadabilitySettings } from '@stylebot/types';

export const READABILITY_SETTINGS_KEY = 'readability-settings';

export const defaultReadabilitySettings: ReadabilitySettings = {
  size: 16,
  width: 40,
  theme: 'light',
  lineHeight: 1.6,
  justify: false,
  font: 'Merriweather',
};

/**
 * The saved reader settings, read straight from storage so content scripts
 * don't depend on a possibly cold background to answer. Not `async`, which
 * would pull another copy of the ES5 async helpers into the content scripts.
 */
export const getReadabilitySettings = (): Promise<ReadabilitySettings> =>
  chrome.storage.local
    .get(READABILITY_SETTINGS_KEY)
    .then(
      items => items[READABILITY_SETTINGS_KEY] || defaultReadabilitySettings
    );
