import BackgroundPageUtils from './utils';

// Update the extension browser action
const BrowserAction = {
  /**
   * Update browser action for the specified tab to indicate
   * CSS is not applied to the current page
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
   * Update browser action for the specified tab to indicate
   * CSS is applied to the current page.
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
   * Update the browser action for the specified tab.
   */
  update(tab: chrome.tabs.Tab, css: string) {
    if (tab.url && BackgroundPageUtils.isValidUrl(tab.url)) {
      if (css) {
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
