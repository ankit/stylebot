/**
  * background.html
  */

// This is the only place you need to update the version string
// besides manifest.json.
var CURRENT_VERSION = '1.7.3.4';

var cache = {
  contextMenuId: null,
  enableStylingContextMenuId: null,

  // Styles object
  styles: {},

  options: {
    useShortcutKey: true,
    shortcutKey: 77, // keydown code for 'm'
    shortcutMetaKey: 'alt',
    mode: 'Basic',
    sync: false,
    contextMenu: true,
    livePreviewColorPicker: true,
    livePreviewPage: true,
    showPageAction: true,
    accordions: [0, 1, 2, 3]
  },

  // Temporary cached map of tabId to rules to prevent recalculating rules
  // for iframes. The cache is only live until the tab completes loading
  // or is closed, whichever occurs first.
  loadingTabs: []
};

// Initialize.
function init() {
  updateVersion(function() {
    initCache(function() {
      initContextMenu();
    });
  });
  attachListeners();
}

/**
  * Updates the version of extension. Does any other essential upgrades.
  */
function updateVersion(callback) {
  chrome.storage.local.get(['version'], function(storage) {
    if (storage['version'] != CURRENT_VERSION) {
      console.log('Updating to version ' + CURRENT_VERSION);
      chrome.storage.local.set({'version': CURRENT_VERSION});
    }

    callback();
  });
}

/**
  * Shows a desktop notification for version update
  */
function showUpdateNotification() {
  var notification = webkitNotifications.createHTMLNotification(
    'notification.html'
  );
  notification.show();
}

/**
  * Attaches listeners to act on requests sent from tabs and page action
  */
function attachListeners() {
  if (cache.options.showPageAction == typeof undefined ||
    cache.options.showPageAction) {
    showPageActions();
  }

  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.tabs.onActivated.addListener(onTabActivated);
  chrome.tabs.onRemoved.addListener(onTabRemoved);

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
    switch (request.name) {
      case 'enablePageAction':
        if (cache.options.showPageAction) {
          enablePageAction(sender.tab);
        }
        sendResponse({});
        break;

      case 'disablePageAction':
        if (cache.options.showPageAction) {
          disablePageAction(sender.tab);
        }
        sendResponse({});
        break;

      case 'highlightPageAction':
        if (cache.options.showPageAction) {
          highlightPageAction(sender.tab);
        }
        sendResponse({});
        break;

      case 'copyToClipboard':
        request.text.copyToClipboard();
        sendResponse({});
        break;

      case 'save':
        cache.styles.save(request.url, request.rules, request.data);
        sendResponse({});
        break;

      case 'doesStyleExist':
        sendResponse(cache.styles.exists(request.url));
        break;

      case 'transfer':
        cache.styles.transfer(request.source, request.destination);
        sendResponse({});
        break;

      case 'getGlobalRules':
        sendResponse(cache.styles.getGlobalRules());
        break;

      case 'getCombinedRulesForPage':
        sendResponse(
          cache.styles.getCombinedRulesForPage(request.url, sender.tab));
        break;

      case 'getCombinedRulesForIframe':
        sendResponse(
          cache.styles.getCombinedRulesForIframe(request.url, sender.tab));
        break;

      case 'fetchOptions':
        sendResponse({
          options: cache.options
        });
        break;

      case 'saveAccordionState':
        saveAccordionState(request.accordions);
        sendResponse({});
        break;

      case 'saveOption':
        saveOption(request.option.name, request.option.value);
        sendResponse({});
        break;

      case 'getOption':
        sendResponse(getOption(request.optionName));
        break;
    }
  });
}

/**
  * Request handler for when an existing tab is updated i.e.
  * refreshed / new page is opened.
  *
  * @param {number} tabId The tab's id
  * @param {object} changeInfo
  * @param {object} The tab object
  */
function onTabUpdated(tabId, changeInfo, tab) {
  if (tab.status === 'complete') {
    clearTabResponseCache(tabId);
    if (cache.options.contextMenu) {
      updateContextMenu(tab);
    }

    updatePageAction(tabId);
  }
}

function onTabActivated(activeInfo) {
  if (cache.options.contextMenu) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      updateContextMenu(tab);
    });
  }
}

/**
  * Request handler for when a tab is closed
  * @param {number} tabId The tab's id
  * @param {object} removeInfo
  */
function onTabRemoved(tabId, removeInfo) {
  clearTabResponseCache(tabId);
}

/**
  * Remove the specified tab from the loading queue
  * @param {number} tabId The id for the tab to be removed
  */
function clearTabResponseCache(tabId) {
  if (cache.loadingTabs[tabId]) {
    delete cache.loadingTabs[tabId];
  }
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is not visible
  *   - No CSS is applied to the current page
  * @param {object} tab The tab for which the page action should be updated
  */
function disablePageAction(tab) {
  chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css.png' });
  chrome.pageAction.setTitle({
    tabId: tab.id,
    title: 'Click to start editing using Stylebot' });
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is not visible
  *   - CSS is applied to the current page
  * @param {object} tab The tab for which the page action should be updated
  */
function highlightPageAction(tab) {
  chrome.pageAction.setIcon({
    tabId: tab.id,
    path: 'images/css_highlighted.png'
  });

  chrome.pageAction.setTitle({
    tabId: tab.id,
    title: 'Click to start editing using Stylebot'
  });
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is visible
  * @param {object} tab The tab for which the page action should be updated
  */
function enablePageAction(tab) {
  chrome.pageAction.setIcon({
    tabId: tab.id,
    path: 'images/css_active.png'
  });

  chrome.pageAction.setTitle({
    tabId: tab.id,
    title: 'Click to stop editing using Stylebot'
  });
}

/**
  * Show the page action for all existing tabs
  */
function showPageActions() {
  chrome.windows.getAll( { populate: true }, function(windows) {
    var w_len = windows.length;
    for (var i = 0; i < w_len; i++) {
      var tabs = windows[i].tabs;
      if (tabs) {
        var t_len = tabs.length;
        for (var j = 0; j < t_len; j++) {
          var tab = tabs[j];
          if (tab.url.isValidUrl())
            chrome.pageAction.show(tab.id);
        }
      }
    }
  });

  chrome.pageAction.onClicked.addListener(onPageActionClick);
}

/**
  * Hide the page action for all existing tabs
  */
function hidePageActions() {
  chrome.windows.getAll({ populate: true }, function(windows) {
    var w_len = windows.length;
    for (var i = 0; i < w_len; i++) {
      var tabs = windows[i].tabs;
      if (tabs) {
        var t_len = tabs.length;
        for (var j = 0; j < t_len; j++) {
          chrome.pageAction.hide(tabs[j].id);
        }
      }
    }
  });

  chrome.pageAction.onClicked.removeListener(onPageActionClick);
}

/**
  * Request listener for when a page action is clicked
  *   Toggles CSS editing for the currently active tab
  * @param {object} tab The tab for which editing is toggled
  */
function onPageActionClick(tab) {
  chrome.tabs.sendRequest(tab.id, { name: 'toggle' }, function(response) {
    if (response.status) {
      enablePageAction(tab);
    } else {
      disablePageAction(tab);
    }
  });
}

/**
  * Request listener for when the user switches a tab
  *   Updates page action for the newly active tab
  * @param {number} tabId The tab's id for whicht th epage action should
  *  be updated.
  */
function updatePageAction(tabId) {
  chrome.tabs.get(tabId, function(tab) {
    if (!tab) {
      return;
    }

    if (tab.url.isValidUrl()) {
      chrome.tabs.sendRequest(tab.id, {name: 'status'}, function(response) {
        if (response) {
          if (response.status) {
            enablePageAction(tab);
          } else if (response.rules || response.global) {
            highlightPageAction(tab);
          } else {
            disablePageAction(tab);
          }
        }
      });
    };
  });
}

/**
  * Merge styles
  * @param {array} newStyles The styles that should be merged.
  * @param {array} oldStyles The styles to merge into.
  *   This is given higher priority over a new style for the same selector
  */
function mergeStyles(newStyles, oldStyles) {
  cache.styles.merge(newStyles, oldStyles);
}


function initCache(callback) {
  chrome.storage.local.get(null, function(storage) {
    if (storage['options']) {
      cache.options = storage['options'];
    }

    if (storage['styles']) {
      cache.styles = new Styles(storage['styles']);
    } else {
      cache.styles = new Styles({});
    }

    if (callback) {
      callback();
    }
  });
}

/**
  * Save an option in cache and datastore.
  * Also pushes the change to all currently open tabs.
  * @param {string} name Option name
  * @param {object} value Option value
  */
function saveOption(name, value) {
  cache.options[name] = value;
  chrome.storage.local.set({'options': cache.options});
  propagateOptions();

  // If the option was contextMenu, update it.
  if (name === 'contextMenu') {
    if (value === false) {
      removeContextMenu();
    } else if (!cache.contextMenuId) {
      initContextMenu();
    }
  }
}

function getOption(name) {
  return cache.options[name];
}

/**
  * Return global CSS rules i.e. for URL '*'
  */
function getGlobalRules() {
  return cache.styles.getGlobalRules();
}

/**
  * Propagate options to all existing tabs
  */
function propagateOptions() {
  sendRequestToAllTabs({
    name: 'setOptions',
    options: cache.options
  }, function() {});
}

/**
  * Save current accordion state of stylebot editor into background page cache
  * @param {array} accordions Indices of open accordions
  */
function saveAccordionState(accordions) {
  cache.options.accordions = accordions;
  chrome.storage.local.set({'options': cache.options});
}

function createContextMenu(title, parentId, action, type) {
  var options = {
    title: title,
    contexts: ['all']
  };

  if (parentId) {
    options.parentId = parentId;
  }

  if (action) {
    options.onclick = function(info, tab) {
      sendRequestToTab(tab, action);
    }
  }

  if (type) {
    options.type = type;
  }

  return chrome.contextMenus.create(options);
}

/**
  * Initialize the right click context menu.
  */
function initContextMenu() {
  chrome.contextMenus.removeAll();
  if (cache.options.contextMenu) {
    menuId = createContextMenu('Stylebot');
    createContextMenu('Style Element', menuId, 'openWidget');
    cache.enableStylingContextMenuId =
      createContextMenu('Enable Styling', menuId, 'toggleStyle', 'checkbox');
    createContextMenu('View Options...', menuId, 'viewOptions');
    createContextMenu('Search...', menuId, 'searchSocial');
    createContextMenu('Share...', menuId, 'shareOnSocial');
    cache.contextMenuId = menuId;
  }
}

/**
  * Update the right-click context menu for a tab i.e.
  *   show or hide and update checkboxes.
  * @param {object} tab Tab based on which the right-click menu is to be updated
  */
function updateContextMenu(tab) {
  if (!tab) {
    return;
  }

  if (!cache.contextMenuId) {
    return;
  }

  if (tab.url.isValidUrl()) {
    // If it is a valid url, show the contextMenu.
    chrome.contextMenus.update(cache.contextMenuId, {
      documentUrlPatterns: ['<all_urls>']
    });

    // Get style status from the tab we changed to and
    // update the checkbox in the context menu.
    if (cache.enableStylingContextMenuId) {
      chrome.tabs.sendRequest(tab.id, {name: 'styleStatus'},
      function(response) {
          chrome.contextMenus.update(cache.enableStylingContextMenuId, {
          checked: response.status
        });
      });
    }
  }

  else {
    // If it isn't a valid url, hide the contextMenu.
    // Set the document pattern to foo/*random*.
    chrome.contextMenus.update(cache.contextMenuId, {
      documentUrlPatterns: ['http://foo/' + Math.random()]
    });
  }
}

/**
  * Remove / Hide the right click context menu
  */
function removeContextMenu() {
  if (cache.contextMenuId) {
    chrome.contextMenus.remove(cache.contextMenuId);
    cache.contextMenuId = null;
  }
}

/**
  * Send a request to all existing tabs
  * @param {object} req Request to send
  */
function sendRequestToAllTabs(req) {
  chrome.windows.getAll({ populate: true }, function(windows) {
    var w_len = windows.length;
    for (var i = 0; i < w_len; i++) {
      var t_len = windows[i].tabs.length;
      for (var j = 0; j < t_len; j++) {
        chrome.tabs.sendRequest(windows[i].tabs[j].id, req, function(response) {});
      }
    }
  });
}

/**
  * Send a message to a tab
  * @param {object} tab Tab to which message is to be sent
  * @param {string} msg Message to send
  */
function sendRequestToTab(tab, msg) {
  chrome.tabs.sendRequest(tab.id, { name: msg }, function() {});
}

/**
  * Initialize the background page
  */
window.addEventListener('load', function() {
  init();
});

// Clone an object. from: http://my.opera.com/GreyWyvern/blog/show.dml/1725165
function cloneObject(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (obj[i] && typeof obj[i] == 'object')
      newObj[i] = cloneObject(obj[i]);
    else
      newObj[i] = obj[i];
  }
  return newObj;
}
