import {
  ToggleStylebot,
  GetStylesForPage,
  GetIsStylebotOpen,
  GetIsPageReaderable,
  GetStylesForPageResponse,
} from '@stylebot/types';

export const getCurrentTab = (
  callback: (tab: chrome.tabs.Tab) => void
): void => {
  chrome.windows.getCurrent({ populate: true }, ({ tabs }) => {
    if (tabs) {
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].active) {
          callback(tabs[i]);
        }
      }
    }
  });
};

export const getStyles = (
  tab: chrome.tabs.Tab,
  callback: (styles: GetStylesForPageResponse) => void
): void => {
  const message: GetStylesForPage = {
    name: 'GetStylesForPage',
    tab,
  };

  chrome.runtime.sendMessage(message, response => {
    callback(response);
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
