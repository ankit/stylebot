import { removeReadability } from '../lifecycle';
import { readCache, writeCache } from '../../inject-css/cache';

import {
  GetStylesForPage,
  GetStylesForPageResponse,
  SetReadability,
} from '@stylebot/types';

/**
 * The key readability was actually enabled under (usually just the domain) —
 * falling back to window.location.href would silently create a new entry.
 */
const getExistingStyleUrl = (): Promise<string> => {
  const message: GetStylesForPage = { name: 'GetStylesForPage' };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      message,
      (response: GetStylesForPageResponse) => {
        resolve(response?.defaultStyle?.url ?? document.domain);
      }
    );
  });
};

/**
 * Mirrors the editor's applyReadability(false) action, so this persists the
 * same way the popup checkbox does, not just tearing down the current DOM.
 */
export const closeReader = async (): Promise<void> => {
  removeReadability();

  const url = await getExistingStyleUrl();

  const message: SetReadability = {
    name: 'SetReadability',
    url,
    value: false,
  };
  chrome.runtime.sendMessage(message);

  const cached = readCache();
  if (cached) {
    writeCache({ ...cached, readability: false });
  }
};
