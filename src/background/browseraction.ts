import BackgroundPageUtils from './utils';

// Update the extension browser action
const BrowserAction = {
  init() {
    // Track when the browser action closes to do cleanup on the current page
    chrome.runtime.onConnect.addListener(function(port) {
      if (port.name === 'browserAction') {
        var activeTab;

        port.onMessage.addListener(function(message) {
          if (message.name === 'activeTab') {
            activeTab = message.tab;
          }
        });
      }
    });
  },

  /**
   * Update browser action for the specified tab to indicate:
   *   - stylebot is not visible
   *   - No CSS is applied to the current page
   */
  unhighlight(tab: chrome.tabs.Tab) {
    chrome.browserAction.setIcon({
      tabId: tab.id,
      path: {
        '19': 'img/css.png',
        '38': 'img/css@2x.png',
      },
    });
  },

  /**
   * Update browser action for the specified tab to indicate:
   *   - stylebot is not visible
   *   - CSS is applied to the current page
   */
  highlight(tab: chrome.tabs.Tab) {
    chrome.browserAction.setIcon({
      tabId: tab.id,
      path: {
        '19': 'img/css_highlighted.png',
        '38': 'img/css_highlighted@2x.png',
      },
    });
  },

  /**
   * Update browser action for the specified tab to indicate:
   *   - stylebot is visible
   */
  activate(tab: chrome.tabs.Tab) {
    chrome.browserAction.setIcon({
      tabId: tab.id,
      path: {
        '19': 'img/css_active.png',
        '38': 'img/css_active@2x.png',
      },
    });
  },

  /**
   * Update the browser action for the specified tab.
   */
  update(tab: chrome.tabs.Tab) {
    if (tab.url && BackgroundPageUtils.isValidUrl(tab.url)) {
      const response = tab.id && window.cache.loadingTabs[tab.id];
      let stylingApplied = false;

      if (
        response &&
        response.rules &&
        Object.keys(response.rules).length !== 0
      ) {
        stylingApplied = true;
      }

      if (stylingApplied) {
        BrowserAction.highlight(tab);
      } else {
        BrowserAction.unhighlight(tab);
      }
    } else {
      BrowserAction.disable(tab.id);
    }
  },

  disable(tabId?: number) {
    chrome.browserAction.disable(tabId);
  },
};

export default BrowserAction;
