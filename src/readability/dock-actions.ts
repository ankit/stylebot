import { remove } from './apply';
import { readCache, writeCache } from '../inject-css/cache';

import {
  GetStylesForPage,
  GetStylesForPageResponse,
  ReadabilitySettings,
  SetReadability,
  SetReadabilitySettings,
} from '@stylebot/types';

// The key readability was actually enabled under (usually just the domain,
// see editor/store/index.ts's state.url default) — falling back to
// window.location.href here would silently create a new per-URL entry
// instead of clearing the existing one.
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

// Mirrors the editor's applyReadability(false) action, so this persists the
// same way the popup checkbox does, not just tearing down the current DOM.
export const closeReader = async (): Promise<void> => {
  remove();

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

export const sendReadabilitySettings = (value: ReadabilitySettings): void => {
  const message: SetReadabilitySettings = {
    name: 'SetReadabilitySettings',
    value,
  };
  chrome.runtime.sendMessage(message);
};

export const openOptionsPage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenOptionsPage' });
};

export const openReportIssuePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenReportIssuePage' });
};

export const openDonatePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenDonatePage' });
};
