import {
  GetStylesForPageRequest,
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
  const request: GetStylesForPageRequest = {
    name: 'getStylesForPage',
    tab,
  };

  chrome.extension.sendRequest(request, response => {
    callback(response);
  });
};

export const getIsStylebotOpen = (
  tab: chrome.tabs.Tab,
  callback: (isOpen: boolean) => void
): void => {
  if (tab.id) {
    chrome.tabs.sendRequest(
      tab.id,
      {
        name: 'getIsStylebotOpen',
      },
      response => callback(response)
    );
  }
};

export const toggleStylebot = (tab: chrome.tabs.Tab): void => {
  if (tab.id) {
    chrome.tabs.sendRequest(tab.id, {
      name: 'toggleStylebot',
    });

    window.close();
  }
};
