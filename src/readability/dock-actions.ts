import { remove } from './apply';
import { readCache, writeCache } from '../inject-css/cache';

import {
  ReadabilitySettings,
  SetReadability,
  SetReadabilitySettings,
} from '@stylebot/types';

// Mirrors the editor's applyReadability(false) action, so this persists the
// same way the popup checkbox does, not just tearing down the current DOM.
export const closeReader = (): void => {
  remove();

  const message: SetReadability = {
    name: 'SetReadability',
    url: window.location.href,
    value: false,
  };
  chrome.runtime.sendMessage(message);

  const cached = readCache();
  if (cached) {
    writeCache({ ...cached, readability: false });
  }
};

export const sendReadabilitySettings = (value: ReadabilitySettings): void => {
  const message: SetReadabilitySettings = {
    name: 'SetReadabilitySettings',
    value,
  };
  chrome.runtime.sendMessage(message);
};
