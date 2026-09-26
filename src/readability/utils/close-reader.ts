import { removeReadability } from '../lifecycle';
import { readCache, writeCache } from '@stylebot/inject-css';

import type {
  GetStylesForPage,
  GetStylesForPageResponse,
  SetReadability,
} from '@stylebot/types';

/**
 * The key readability was actually enabled under (usually just the domain) —
 * falling back to window.location.href would silently create a new entry.
 */
const getExistingStyleUrl = async (): Promise<string> => {
  const message: GetStylesForPage = { name: 'GetStylesForPage' };

  const response = await chrome.runtime.sendMessage<
    GetStylesForPage,
    GetStylesForPageResponse
  >(message);

  return response?.defaultStyle?.url ?? document.domain;
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
