// Update the extension page action
var PageAction = {
  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is not visible
    *   - No CSS is applied to the current page
    * @param {object} tab The tab for which the page action should be updated
    */
  disable: function(tab) {
    chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css.png' });
    chrome.pageAction.setTitle({
      tabId: tab.id,
      title: 'Click to start editing using Stylebot'
    });
  },

  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is not visible
    *   - CSS is applied to the current page
    * @param {object} tab The tab for which the page action should be updated
    */
  highlight: function(tab) {
    chrome.pageAction.setIcon({
      tabId: tab.id,
      path: 'images/css_highlighted.png'
    });

    chrome.pageAction.setTitle({
      tabId: tab.id,
      title: 'Click to start editing using Stylebot'
    });
  },

  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is visible
    * @param {object} tab The tab for which the page action should be updated
    */
  enable: function(tab) {
    chrome.pageAction.setIcon({
      tabId: tab.id,
      path: 'images/css_active.png'
    });

    chrome.pageAction.setTitle({
      tabId: tab.id,
      title: 'Click to stop editing using Stylebot'
    });
  },

  /**
    * Show the page action for all tabs
    */
  showAll: function() {
    chrome.windows.getAll({populate: true}, function(windows) {
      var w_len = windows.length;
      for (var i = 0; i < w_len; i++) {
        var tabs = windows[i].tabs;
        if (tabs) {
          var t_len = tabs.length;
          for (var j = 0; j < t_len; j++) {
            var tab = tabs[j];
            if (tab.url.isValidUrl()) {
              chrome.pageAction.show(tab.id);
            }
          }
        }
      }
    });

    chrome.pageAction.onClicked.addListener(PageAction.onClick);
  },

  /**
    * Hide the page action for all tabs
    */
  hideAll: function() {
    chrome.windows.getAll({ populate: true }, function(windows) {
      var w_len = windows.length;
      for (var i = 0; i < w_len; i++) {
        var tabs = windows[i].tabs;
        if (tabs) {
          var t_len = tabs.length;
          for (var j = 0; j < t_len; j++) {
            var tab = tabs[j];
            if (tab.url.isValidUrl()) {
              chrome.pageAction.hide(tab.id);
            }
          }
        }
      }
    });

    chrome.pageAction.onClicked.removeListener(PageAction.onClick);
  },

  /**
    * Request listener for when a page action is clicked
    *   Toggles CSS editing for the currently active tab
    * @param {object} tab The tab for which editing is toggled
    */
  onClick: function(tab) {
    chrome.tabs.sendRequest(tab.id, { name: 'toggle' }, function(response) {
      if (response.status) {
        PageAction.enable(tab);
      } else {
        PageAction.disable(tab);
      }
    });
  },

  /**
    * Request listener for when the user switches a tab
    *   Updates page action for the newly active tab
    * @param {number} tabId The tab's id for whicht th epage action should
    *  be updated.
    */
  update: function(tabId) {
    chrome.tabs.get(tabId, function(tab) {
      if (!tab) {
        return;
      }

      if (tab.url.isValidUrl()) {
        chrome.tabs.sendRequest(tab.id, {name: 'status'}, function(response) {
          if (response) {
            if (response.status) {
              PageAction.enable(tab);
            } else if (response.rules || response.global) {
              PageAction.highlight(tab);
            } else {
              PageAction.disable(tab);
            }
          }
        });
      };
    });
  }
}
