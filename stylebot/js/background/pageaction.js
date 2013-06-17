// Update the extension page action
var PageAction = {
  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is not visible
    *   - No CSS is applied to the current page
    * @param {object} tab The tab for which the page action should be updated
    */
  unhighlight: function(tab) {
    if (!cache.options.showPageAction) { return; }

    PageAction.show(tab);
    chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css.png' });
  },

  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is not visible
    *   - CSS is applied to the current page
    * @param {object} tab The tab for which the page action should be updated
    */
  highlight: function(tab) {
    if (!cache.options.showPageAction) { return; }

    PageAction.show(tab);
    chrome.pageAction.setIcon({
      tabId: tab.id,
      path: 'images/css_highlighted.png'
    });
  },

  /**
    * Update page action for the specified tab to indicate:
    *   - stylebot is visible
    * @param {object} tab The tab for which the page action should be updated
    */
  activate: function(tab) {
    if (!cache.options.showPageAction) { return; }

    PageAction.show(tab);
    chrome.pageAction.setIcon({
      tabId: tab.id,
      path: 'images/css_active.png'
    });
  },

  /**
    * Update the page action for the specified tab.
    * @param {Object} tab The tab for which to update the page action.
    * @param {Boolean} stylingApplied If the tab has any style rules applied to it.
    */
  update: function(tab, stylingApplied) {
    if (tab.url.isValidUrl()) {
      if (stylingApplied) {
        PageAction.highlight(tab);
      } else {
        PageAction.unhighlight(tab);
      }
    } else {
      PageAction.hide(tab);
    }
  },

  /**
    * Show the page action for the specified tab.
    * @param {Object} tab The tab for which to show the page action.
    */
  show: function(tab) {
    chrome.pageAction.show(tab.id);
  },

  /**
    * Hide the page action for the specified tab.
    * @param {Object} tab The tab for which to hide the page action.
    */
  hide: function(tab) {
    chrome.pageAction.hide(tab.id);
  },

  /**
    * Show the page action for all tabs.
    */
  showAll: function() {
    if (!cache.options.showPageAction) { return; }

    chrome.windows.getAll({populate: true}, function(windows) {
      var w_len = windows.length;
      for (var i = 0; i < w_len; i++) {
        var tabs = windows[i].tabs;
        if (tabs) {
          var t_len = tabs.length;
          for (var j = 0; j < t_len; j++) {
            var tab = tabs[j];
            if (tab.url.isValidUrl()) {
              PageAction.update(tab);
            }
          }
        }
      }
    });
  },

  /**
    * Hide the page action for all tabs.
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
            PageAction.hide(tab);
          }
        }
      }
    });
  }
}
