import type {
  ToggleStylebot,
  GetCommandsResponse,
  GetOptionResponse,
  GetIsStylebotOpen,
  GetIsPageReaderable,
  GetStylesForPageResponse,
  StylebotOptions,
} from '@stylebot/types';
import { STYLES_KEY, getStylesForPage } from '@stylebot/saved-styles';
import { defaultOptions } from '@stylebot/settings';

import {
  openOptionsPage,
  openReportIssuePage,
  openDonatePage,
  supportsEditorSidePanel,
  openEditorSidePanel,
  getBrowserCommands,
} from '@stylebot/utils';

export const getCurrentTab = (
  callback: (tab: chrome.tabs.Tab) => void
): void => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) {
      callback(tab);
    }
  });
};

/**
 * Reads the tab's styles straight from storage rather than through the
 * background, which may first have to wake its service worker.
 */
export const getStyles = (
  tab: chrome.tabs.Tab,
  callback: (styles: GetStylesForPageResponse) => void
): void => {
  chrome.storage.local.get(STYLES_KEY, items => {
    callback(getStylesForPage(tab.url ?? '', items[STYLES_KEY] || {}));
  });
};

export const getIsStylebotOpen = (
  tab: chrome.tabs.Tab,
  callback: (isOpen: boolean) => void
): void => {
  if (tab.id) {
    const message: GetIsStylebotOpen = {
      name: 'GetIsStylebotOpen',
    };

    chrome.tabs.sendMessage(tab.id, message, (response: boolean) =>
      callback(response)
    );
  }
};

export const getIsPageReaderable = (
  tab: chrome.tabs.Tab,
  callback: (isReaderable: boolean) => void
): void => {
  if (tab.id) {
    const message: GetIsPageReaderable = {
      name: 'GetIsPageReaderable',
    };

    // No response (e.g. no content script on this page, chrome:// urls)
    // means readability can't apply here either.
    chrome.tabs.sendMessage(tab.id, message, (response: boolean) =>
      callback(!!response)
    );
  }
};

export const toggleStylebot = (tab: chrome.tabs.Tab): void => {
  if (tab.id) {
    const message: ToggleStylebot = {
      name: 'ToggleStylebot',
    };

    chrome.tabs.sendMessage(tab.id, message);
    window.close();
  }
};

/**
 * Opens the editor in the tab's side panel straight from the popup's click,
 * as the page couldn't once its gesture is gone; falls back to the page.
 */
export const openStylebotSidePanel = (tab: chrome.tabs.Tab): void => {
  if (!tab.id || !supportsEditorSidePanel()) {
    toggleStylebot(tab);
    return;
  }

  openEditorSidePanel(tab.id).then(
    () => window.close(),
    () => toggleStylebot(tab)
  );
};

/**
 * Reads the shortcuts from the browser, which owns them, and options straight
 * from storage, so the popup's chips and theme never wait on the background.
 */
export const getCommands = (
  callback: (commands: GetCommandsResponse) => void
): void => {
  getBrowserCommands().then(callback);
};

export const getOption = <K extends keyof StylebotOptions>(
  optionName: K,
  callback: (value: GetOptionResponse) => void
): void => {
  chrome.storage.local.get('options', items => {
    callback({ ...defaultOptions, ...items['options'] }[optionName]);
  });
};

export const openOptions = (): void => {
  openOptionsPage();
  window.close();
};

export const openSyncOptions = (): void => {
  openOptionsPage('/sync');
  window.close();
};

export const reportIssue = (): void => {
  openReportIssuePage();
  window.close();
};

export const donate = (): void => {
  openDonatePage();
  window.close();
};

// Space-triggered activation also scrolls the page by default; swallow that
// along with Enter's native form-submit behavior.
export const onEnterOrSpace = (
  event: KeyboardEvent,
  handler: () => void
): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler();
  }
};

// A SToggleSwitch's <label> shrink-wraps its content, so clicks in a
// wrapping container's padding land nowhere — this extends the hit target.
export const forwardClickToInput = (
  event: MouseEvent,
  container: Element
): void => {
  const target = event.target as HTMLElement;

  if (target.closest('label, input')) {
    return;
  }

  const input = container.querySelector('input') as HTMLInputElement | null;
  input?.click();
};
