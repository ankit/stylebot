// Update the extension browser action
const BrowserAction = {
  /**
   * Update browser action for the specified tab to indicate
   * CSS is not applied to the current page
   */
  unhighlight(tab: chrome.tabs.Tab): void {
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
  highlight(tab: chrome.tabs.Tab): void {
    chrome.browserAction.setIcon({
      tabId: tab.id,
      path: {
        '19': 'img/css_highlighted.png',
        '38': 'img/css_highlighted@2x.png',
      },
    });
  },
};

export default BrowserAction;
