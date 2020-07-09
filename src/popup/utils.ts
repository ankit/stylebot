export const getCurrentTab = (
  callback: (tab: chrome.tabs.Tab) => void
): void => {
  chrome.windows.getCurrent({ populate: true }, ({ tabs }) => {
    if (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].active) {
          callback(tabs[i]);
        }
      }
    }
  });
};

export const getStyleUrlMetadataForTab = (
  tab: chrome.tabs.Tab,
  callback: (styleUrlMetadata: Array<{ url: string; enabled: boolean }>) => void
) => {
  chrome.extension.sendRequest(
    { name: 'getStyleUrlMetadataForTab', tab },
    response => {
      if (response && response.success) {
        callback(response.styleUrlMetadata);
        return;
      }

      callback([]);
    }
  );
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

export const setAsActiveTab = (tab: chrome.tabs.Tab) => {
  const port = chrome.runtime.connect({
    name: 'browserAction',
  });

  port.postMessage({
    tab: tab,
    name: 'activeTab',
  });
};

export const toggleStylebot = (tab: chrome.tabs.Tab) => {
  if (tab.id) {
    chrome.tabs.sendRequest(tab.id, {
      name: 'toggle',
    });

    window.close();
  }
};

export const viewOptions = () => {
  chrome.tabs.create({
    active: true,
    url: 'options/index.html',
  });

  window.close();
};
