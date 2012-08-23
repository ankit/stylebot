/**
  * background.html
  */

var CURRENT_VERSION = '1.7';

var currTabId;

var cache = {
  contextMenuId: null,
  styleStatusContextMenuId: null,

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

  // temporary cached map of tabId to rules. This is used to prevent recalculating rules for iframes
  // the cache is only live until the tab completes loading or is closed, whichever occurs first
  loadingTabs: []
};

// Initialize
function init() {
  updateVersion();
  initCache(function() {
    initContextMenu();
  });
  attachListeners();
}

/**
  * Update the version of extension.
  * Does any other essential upgrades. Also, shows update desktop notification
  */
function updateVersion() {
  chrome.storage.local.get(['version'], function(storage) {
    if (storage['version'] != CURRENT_VERSION) {
      console.log('Updating to version ' + CURRENT_VERSION);
      chrome.storage.local.set({'version': CURRENT_VERSION});

      cache.styles = new Styles({});
      cache.styles.upgrade('1.7');

      showUpdateNotification();
      return true;
    }
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
  chrome.tabs.onSelectionChanged.addListener(updatePageActionOnTabSelectionChanged);
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
  chrome.tabs.onSelectionChanged.removeListener(updatePageActionOnTabSelectionChanged);
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
  * @param {number} tabId The tab's id for which the page action is to be updated
  * @param {object} selectInfo
  */
function updatePageActionOnTabSelectionChanged(tabId, selectInfo) {
  chrome.tabs.get(tabId, function(tab) {
    if (tab.url.isValidUrl()) {
      chrome.tabs.sendRequest(tab.id, {name: 'status'}, function(response) {
        if (response.status)
          enablePageAction(tab);
        else if (response.rules || response.global)
          highlightPageAction(tab);
        else
          disablePageAction(tab);
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
    cache.options = storage['options']
    cache.styles = new Styles(storage['styles']);
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
    cache.styleStatusContextMenuId =
      createContextMenu('Enable Styling', menuId, 'toggleStyle', 'checkbox');
    createContextMenu('View Options...', menuId, 'viewOptions');
    createContextMenu('Search...', menuId, 'searchSocial');
    createContextMenu('Share...', menuId, 'shareOnSocial');
    cache.contextMenuId = menuId;

    // Add onUpdated listener so we can track tab refresh.
    chrome.tabs.onUpdated.addListener(
      updateContextMenuOnUpdated);

    // Add a selectionChanged listener so we can track changes in current tab.
    chrome.tabs.onSelectionChanged.addListener(
      updateContextMenuOnSelectionChanged);
  }
}

function updateContextMenuOnUpdated(tabId, changeInfo, tab) {
  if (tab.status != 'complete') {
    return;
  }
  updateContextMenu(tab);
}

function updateContextMenuOnSelectionChanged(tabId, selectInfo) {
  chrome.tabs.get(tabId, function(tab) {
    updateContextMenu(tab);
  });
}

/**
  * Update the right-click context menu for a tab i.e.
  *   show or hide and update checkboxes
  * @param {object} tab Tab based on which the right-click menu is to be updated
  */
function updateContextMenu(tab) {
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
    if (cache.styleStatusContextMenuId) {
      chrome.tabs.sendRequest(tab.id, {name: 'styleStatus'},
      function(response) {
          chrome.contextMenus.update(cache.styleStatusContextMenuId, {
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
    chrome.tabs.onSelectionChanged.removeListener(
      updateContextMenuOnSelectionChanged);
    chrome.tabs.onUpdated.removeListener(updateContextMenuOnUpdated);
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

/**
  * Styles object used by background.js
  * @constructor
  * @param {Object} param JSON style object
  * Example:
  * styles = {
      'google.com' : {.
        _rules: {
          'a': {
            'color': 'red'
          }
        },
        _social: {
          id: 4,
          timestamp: 123456 (UNIX based)
        },
        _enabled: true
      }
    }
  */
function Styles(param) {
  this.styles = param;
}

/**
  * Deletes an style
  * @param {String} url The url of the style to delete.
  */
Styles.prototype.delete = function(url) {
  delete this.styles[url];
  this.persist();
};

/**
  * Returns the style object associated with the given url
  *   If no url is given, returns all the style objects
  * @param {String} url The URL of the requested object.
  * @return {Object} The request style(s) object(s).
  */
Styles.prototype.get = function(url) {
  if (url === undefined) {
    return this.styles;
  } else {
    return this.styles[url];
  }
};

Styles.prototype.set = function(url, value) {
  if (url === undefined) {
    return false;
  } else {
    this.styles[url] = value;
    return this.styles[url];
  }
};

Styles.prototype.persist = function() {
  chrome.storage.local.set({'styles': this.styles});
}

/**
  * Creates a new style for the given URL
  * @param {String} url URL of the new object.
  * @param {Object} rules Rules for the given URL.
  */
Styles.prototype.create = function(url, rules, data) {
  this.styles[url] = {};
  this.styles[url]['_enabled'] = true;
  this.styles[url]['_rules'] = rules === undefined ? {} : rules;
  if (data !== undefined) {
    this.setMetadata(url, data);
  }
  this.persist();
};

/**
  * Saves the given metadata inside the style for the given URL.
  * @param {String} url URL of the saved object.
  * @param {Object} data New metadata for the given URL.
  */
Styles.prototype.setMetadata = function(url, data) {
  this.styles[url]['_social'] = {};
  this.styles[url]['_social'].id = data.id;
  this.styles[url]['_social'].timestamp = data.timestamp;
};

/**
  * Retrieves the enabled status for the given URL
  * @param {String} url URL of the requested object.
  * @return {Boolean} The enabled status for the given URL.
  */
Styles.prototype.isEnabled = function(url) {
  if (this.styles[url] === undefined) {
    return false;
  }
  return this.styles[url]['_enabled'];
};

/**
  * Saves the given rules and metadata inside the style for the given URL.
  *   If no rules are given, the given URL style is deleted.
  * @param {String} url URL of the saved object.
  * @param {Object} rules rules New rules for the given URL.
  * @param {Object} data New metadata for the given URL.
  */
Styles.prototype.save = function(url, rules, data) {
  if (!url || url === '') {
    return;
  }

  if (rules) {
    this.create(url, rules, data);
  } else {
    this.delete(url);
  }
};

/**
  * If no value is given toggles the enabled status for the given URL.
  *   Otherwise, sets the enabled status for the given URL.
  * @param {String} url URL of the saved object.
  * @param {Object} value The enabled status for the given URL.
  */
Styles.prototype.toggle = function(url, value, shouldSave) {
  if (this.isEmpty(url)) {
    return false;
  }

  if (value != undefined && value != null) {
    this.styles[url]['_enabled'] = !this.styles[url]['_enabled'];
  } else {
    this.styles[url]['_enabled'] = value;
  }

  if (shouldSave) {
    this.persist();
  }

  return true;
};

/**
  * If no value is given toggles the enabled status for all the styles.
  *   Otherwise, sets the enabled status for all the styles.
  * @param {Object} value The enabled status.
  */
Styles.prototype.toggleAll = function(value) {
  for (var url in this.styles) {
    this.toggle(url, value, false);
  }
  this.persist();
};

Styles.prototype.deleteAll = function() {
  this.styles = {};
  this.persist();
};

/**
  * Check if the style for the given identifier exists.
  * @param {String} url The style's identifier.
  * @return {Boolean} True if the requested style exists.
  */
Styles.prototype.isEmpty = function(url) {
  return this.styles[url] === undefined || this.styles[url] == null;
};

/**
  * Empties an style associated rules
  * @param {String} url Identifier of the style to empty.
  */
Styles.prototype.emptyRules = function(url) {
  this.styles[url]['_rules'] = null;
  this.persist();
};

/**
  * Imports a styles object i.e. replaces the existing styles
  *   object with the specified object
  * @param {Object} newStyles Styles object to import.
  */
Styles.prototype.import = function(newStyles) {
  for (var url in newStyles) {
    if (newStyles[url]['_rules']) {
      // it's the new format.
      this.styles[url] = newStyles[url];
    } else {
      // legacy support for the old format.
      this.create(url, newStyles[url]);
    }
  }

  this.persist();
};

/**
  * Upgrades the style object to match the specified version
  * @param {String} version The version to upgrade to
  */
Styles.prototype.upgrade = function(version) {
  switch (version) {
    case '1.7':
      console.log('Upgrading data model for 1.7');

      chrome.storage.local.set({'styles':
        JSON.parse(localStorage['stylebot_styles'])});

      for (var option in cache.options) {
        var value = localStorage['stylebot_option_' + option];
        if (value) {
          if (value === 'true' || value === 'false') {
            value = (value === 'true');
          }
          cache.options[option] = value;
        } else {
          value = cache.options[option];
        }
      }

      chrome.storage.local.set({'options': cache.options})
      chrome.storage.local.get(null, function(storage) {
        console.log(storage);
      });
      break;
  }
};

/**
  * Retrieves rules for the given identifier
  * @param {String} url The given identifier.
  * @return {Object} The enabled status for the given URL.
  */
Styles.prototype.getRules = function(url) {
  if (this.styles[url] === undefined) {
    return null;
  }
  var rules = this.styles[url]['_rules'];
  return rules ? rules : null;
};

/**
  * Returns if a style exists for the URL
  * @param {String} aURL The URL to check.
  * @return {Boolean} True if any rules are associated with the URL
  */
Styles.prototype.exists = function(aURL) {
  if (this.isEnabled(aURL) && aURL !== '*') {
    return true;
  }
  else {
    return false;
  }
};

/**
  * Retrieves all the CSS rules applicable to the URL,
  *   including global CSS rules
  * @param {String} aURL The URL to retrieve the rules for.
  * @return {Object} rules: The rules. url: The identifier representing the URL.
  */
Styles.prototype.getCombinedRulesForPage = function(aURL, tab) {
  // global css rules
  var global;
  if (this.isEmpty('*') || !this.isEnabled('*'))
    global = null;
  else
    global = this.getRules('*');

  if (!aURL.isOfHTMLType())
    return {rules: null, url: null, global: null};

  var response;

  // if the URL is stylebot.me, return rules for stylebot.me if they exist
  // otherwise, return response as null
  if (aURL.indexOf('stylebot.me') != -1) {
    if (!this.isEmpty('stylebot.me')) {
      response = {
        rules: this.getRules('stylebot.me'),
        url: 'stylebot.me',
        global: global
      };
    }
    else {
      response = {
        rules: null,
        url: null,
        global: global
      };
    }
  }

  else {
    // this will contain the combined set of evaluated rules to be applied to
    // the page. longer, more specific URLs get the priority for each selector
    // and property
    var rules = {};
    var url_for_page = '';
    var found = false;

    for (var url in this.styles) {
      if (!this.isEnabled(url) || url === '*')
        continue;

      if (aURL.matchesPattern(url)) {
        if (!found) found = true;

        if (url.length > url_for_page.length)
          url_for_page = url;

        // iterate over each selector in styles
        var urlRules = this.getRules(url);

        for (var selector in urlRules) {
          // if no rule exists for selector, simply copy the rule
          if (rules[selector] == undefined)
            rules[selector] = cloneObject(urlRules[selector]);
          // otherwise, iterate over each property
          else {
            for (var property in urlRules[selector]) {
              if (rules[selector][property] == undefined || url == url_for_page)
                rules[selector][property] = urlRules[selector][property];
            }
          }
        }
      }
    }
    if (found) {
      response = {
        rules: rules,
        url: url_for_page,
        global: global
      };
    }
    else {
      response = {
        rules: null,
        url: null,
        global: global
      };
    }
  }

  // Update page action.
  if (cache.options.showPageAction) {
    if (response.rules || response.global) {
      highlightPageAction(tab);
    } else {
      disablePageAction(tab);
    }
    chrome.pageAction.show(tab.id);
  }

  cache.loadingTabs[tab.id] = response;
  return response;
};

Styles.prototype.getCombinedRulesForIframe = function(aURL, tab) {
  var response;
  if (response = cache.loadingTabs[tab.id]) {
    // just in case the page action wasn't updated when getCombinedRulesForPage was called
    // this mostly occurs when there are lots of iframes in a page. e.g. plus.google.com
    // todo: find a better way out for this
    if (cache.options.showPageAction) {
      if (response.rules || response.global)
        highlightPageAction(tab);
      else
        disablePageAction(tab);

      chrome.pageAction.show(tab.id);
    }
    return response;
  }
  else {
    return this.getCombinedRulesForPage(aURL, tab);
  }
}

/**
  * Retrieves Get all the global rules
  * @return {Object} The rules of the global stylesheet.
  */
Styles.prototype.getGlobalRules = function() {
  if (this.isEmpty('*') || !this.isEnabled('*')) {
    return null;
  }
  return this.getRules('*');
};

/**
  * Transfer rules from source URL to destination URL.
  * @param {String} source Source's identifier.
  * @param {String} destination Destination's identifier.
  */
Styles.prototype.transfer = function(source, destination) {
  if (this.styles[source]) {
    this.styles[destination] = this.styles[source];
    this.persist();
  }
};

// Utility methods

/**
  * Trims a string
  * @return {String} The trimmed string.
  */
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
};

/**
  * Checks if a given string is a pattern
  * @return {Boolean} True if the string is a patern, false otherwise.
  */
String.prototype.isPattern = function() {
  // Currently, the only indicator that a string is a pattern is if
  //if thas the wildcard character *
  return this.indexOf('*') >= 0;
};

/**
  * Checks if the string matches an stylebot pattern
  * @param {String} pattern The stylebot pattern.
  * @return {Boolean} True if the string matches the patern, false otherwise.
  */
String.prototype.matchesPattern = function(pattern) {
  if (pattern.isPattern()) {
    try {
      var hasComma = ~pattern.indexOf(',');
      pattern = pattern.
      /* Removes white spaces */
      replace(/ /g, '').
      /* Escapes . ? | ( ) [ ] + $ ^ \ { } */
      replace(/(\.|\?|\||\(|\)|\[|\]|\+|\$|\^|\\|\{|\})/g, '\\$1').
      /* Allows commas to be used to separate urls */
      replace(/,/g, '|').
      /* Allows use of the ** wildcard, matches anything */
      replace(/\*\*/g, '.*').
      /* Allows use of the * wildcard, matches anything but /
      Because we replace ** with .*, we have to make sure we
      don't replace an .* Therefore, we should replace an *
      if, and only if it is precedeed by anything different
      from a . except for \. (may be the beginning of a line
      too, i.e. the ^ symbol)
      Note: If we add an * before \* we are adding lazyness
      to the regexp which only reduces its performance.
      That's why I replaced the * with an ^ to check
      for patterns of the form `*something`
      */
      replace(/(^|\\\.|[^\.])\*/g, '$1[^/]*');
      /* Enclose the pattern in ( ) if it has several urls separated by , */
      pattern = (hasComma ? '(' + pattern + ')' : pattern);
      /* Matches the beginning of the url, we only consider http(s) urls */
      pattern = '^https?://' + pattern;
      pattern = new RegExp(pattern, 'i');
      return pattern.test(this);
    }

    catch (e) {
      console.log('Error occured while running pattern check', e);
      return false;
    }
  }
  else
    return this.matchesBasic(pattern);
};

/**
  * Checks if the given url matches with the basic algorithm
  * @param {String} pattern The stylebot pattern.
  * @return {Boolean} True if the string matches the patern, false otherwise.
  */
String.prototype.matchesBasic = function(pattern) {
  var isFound = false;
  var subUrls = pattern.split(',');
  var len = subUrls.length;
  for (var i = 0; i < len; i++) {
    if (this.indexOf(subUrls[i].trim()) != -1) {
      isFound = true;
      break;
    }
  }
  return isFound;
};

/**
  * Check if Stylebot should run on a URL.
  * @return {Boolean} True if Stylebot can run on the URL
  */
String.prototype.isValidUrl = function() {
  return (this.indexOf('https://chrome.google.com/webstore') === -1
  && this.indexOf('chrome-extension://') == -1
  && this.indexOf('chrome://') == -1
  && this.isOfHTMLType());
};

/**
  * Checks the extension of the URL to determine if it is valid HTML
  * @return {Boolean} True if the string does not have an extension json/pdf.
  */
String.prototype.isOfHTMLType = function() {
  var nonHTMLExt = ['json', 'pdf'];
  if (nonHTMLExt.indexOf(this.getExtension()) != -1)
    return false;
  return true;
};

/**
  * Returns the extension of the given filename / URL. Deliberately not using a regex here
  * @return {String} The extension.
  */
String.prototype.getExtension = function() {
  return this.split('.').pop();
};

/**
  * Copies the string to the clipboard
  */
String.prototype.copyToClipboard = function() {
  var copyTextarea = document.createElement('textarea');
  document.body.appendChild(copyTextarea);
  copyTextarea.value = this;
  copyTextarea.select();
  document.execCommand('copy');
  document.body.removeChild(copyTextarea);
};

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
