/**
  * background.html
  */

var CURRENT_VERSION = '1.6';

var currTabId;
var contextMenuId = null;

var cache = {
  // Styles object
  styles: {},

  options: {
    useShortcutKey: true,
    shortcutKey: 77, // keydown code for 'm'
    shortcutMetaKey: 'alt',
    mode: 'Basic',
    sync: false,
    contextMenu: true,
    livePreviewColorPicker: false,
    showPageAction: true
  },

  // indices of enabled accordions in panel. by default, all are enabled
  enabledAccordions: [0, 1, 2, 3],

  // temporary cached map of tabId to rules. This is used to prevent recalculating rules for iframes
  // the cache is only live until the tab completes loading or is closed, whichever occurs first
  loadingTabs: []
};

// Initialize
function init() {
  loadOptionsIntoCache();
  loadStylesIntoCache();
  loadAccordionState();
  updateVersion();

  createContextMenu();
  attachListeners();

  if (cache.options.sync) {
    loadSyncId();
    attachSyncListeners();
  }
}

/**
  * Update the version of extension
  *   Does any other essential upgrades. Also, shows update desktop notification
  */
function updateVersion() {
  if (!localStorage.version) {
    updateVersionString();
    return true;
  }

  if (localStorage.version != CURRENT_VERSION) {
    // legacy support for any users who jump from 1.3.x to 1.4.x
    // versions to the current version
    if (parseFloat(CURRENT_VERSION) === 1.4)
      cache.styles.upgrade('1.4');
    // only show notification for X.X updates
    if (parseFloat(localStorage.version) < parseFloat(CURRENT_VERSION))
      showUpdateNotification();
    // update version string in localStorage
    updateVersionString();
  }
}

/**
  * Updates version string in localStorage
  */
function updateVersionString() {
  console.log('Updating to version ' + CURRENT_VERSION);
  localStorage.version = CURRENT_VERSION;
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
    cache.options.showPageAction)
      showPageActions();

  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.tabs.onRemoved.addListener(onTabRemoved);

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
    switch (request.name) {
      case 'enablePageAction':
        if (cache.options.showPageAction)
          enablePageAction(sender.tab);
        sendResponse({});
        break;

      case 'disablePageAction':
        if (cache.options.showPageAction)
          disablePageAction(sender.tab);
        sendResponse({});
        break;

      case 'highlightPageAction':
        if (cache.options.showPageAction)
          highlightPageAction(sender.tab);
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
        sendResponse(cache.styles.getCombinedRulesForPage(request.url, sender.tab));
        break;

      case 'getCombinedRulesForIframe':
        sendResponse(cache.styles.getCombinedRulesForIframe(request.url, sender.tab));
        break;

      case 'fetchOptions':
        sendResponse({
          options: cache.options,
          enabledAccordions: cache.enabledAccordions
        });
        break;

      case 'saveAccordionState':
        saveAccordionState(request.enabledAccordions);
        sendResponse({});
        break;

      case 'savePreference':
        savePreference(request.preference);
        sendResponse({});
        break;

      case 'getPreference':
        sendResponse(getPreference(request.preferenceName));
        break;

      case 'pushStyles':
        cache.styles.push();
        sendResponse({});
        break;
    }
  });
}

/**
  * Request handler for when an existing tab is updated i.e. refreshed / new page is opened
  * @param {number} tabId The tab's id
  * @param {object} changeInfo
  * @param {object} The tab object
  */
function onTabUpdated(tabId, changeInfo, tab) {
  if (tab.status === 'completed')
    clearTabResponseCache(tabId);
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
  if (cache.loadingTabs[tabId])
    delete cache.loadingTabs[tabId];
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is not visible
  *   - No CSS is applied to the current page
  * @param {object} tab The tab for which the page action should be updated
  */
function disablePageAction(tab) {
  chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css.png' });
  chrome.pageAction.setTitle({ tabId: tab.id, title: 'Click to start editing using Stylebot' });
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is not visible
  *   - CSS is applied to the current page
  * @param {object} tab The tab for which the page action should be updated
  */
function highlightPageAction(tab) {
  chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css_highlighted.png' });
  chrome.pageAction.setTitle({ tabId: tab.id, title: 'Click to start editing using Stylebot' });
}

/**
  * Update page action for the specified tab to indicate:
  *   - stylebot is visible
  * @param {object} tab The tab for which the page action should be updated
  */
function enablePageAction(tab) {
  chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css_active.png' });
  chrome.pageAction.setTitle({ tabId: tab.id, title: 'Click to stop editing using Stylebot' });
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
    if (response.status)
      enablePageAction(tab);
    else
      disablePageAction(tab);
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
    chrome.tabs.sendRequest(tab.id, {name: 'status'}, function(response) {
      if (response.status)
        enablePageAction(tab);
      else if (response.rules || response.global)
        highlightPageAction(tab);
      else
        disablePageAction(tab);
    });
  });
}

/**
  * Replace the styles object with the specified object
  * @param {array} styles
  */
function saveStyles(styles) {
  cache.styles = new Styles(styles);
  cache.styles.persist();
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

/**
  * Load styles from localStorage into the background page cache
  */
function loadStylesIntoCache() {
  if (localStorage['stylebot_styles']) {
    try {
      var styles = JSON.parse(localStorage['stylebot_styles']);
      if (typeof styles === 'Styles') {
        // Debug code in case the encapsulated styles bug reappears
        console.trace();
        console.log(styles);
        cache.styles = styles;
      }
      else {
        cache.styles = new Styles(styles);
      }
    }

    catch (e) {
      console.log(e);
      cache.styles = new Styles({});
      cache.styles.persist();
    }
  }

  else {
    cache.styles = new Styles({});
    cache.styles.persist();
  }
}

/**
  * Load options from localStorage into the background page cache
  */
function loadOptionsIntoCache() {
  for (var option in cache.options) {
    var dataStoreValue = localStorage['stylebot_option_' + option];
    if (dataStoreValue) {
      if (dataStoreValue == 'true' || dataStoreValue == 'false')
        cache.options[option] = (dataStoreValue == 'true');
      else
        cache.options[option] = dataStoreValue;
    }
    else
      localStorage['stylebot_option_' + option] = cache.options[option];
  }
}

/**
  * Save an option in cache and localStorage and push it to all open tabs
  * @param {string} name Option name
  * @param {object} value Option value
  */
function saveOption(name, value) {
  cache.options[name] = value;
  localStorage['stylebot_option_' + name] = value;
  propagateOptions();

  // option specific code
  if (name === 'contextMenu' && value === false)
    removeContextMenu();
  else if (!contextMenuId)
    createContextMenu();
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
  sendRequestToAllTabs({ name: 'setOptions', options: cache.options }, function() {});
}

/**
  * Save current accordion state of stylebot editor into background page cache
  * @param {array} enabledAccordions Indices of open accordions
  */
function saveAccordionState(enabledAccordions) {
  cache.enabledAccordions = enabledAccordions;
  localStorage['stylebot_enabledAccordions'] = enabledAccordions;
}

/**
  * Load previous accordion state of stylebot into background page cache
  */
function loadAccordionState() {
  if (localStorage['stylebot_enabledAccordions'])
    cache.enabledAccordions = localStorage['stylebot_enabledAccordions'].split(',');
}

/**
  * Save an option to localStorage
  * @param {object} preference Option name + value
  */
function savePreference(preference) {
  localStorage[preference.name] = preference.value;
}

/**
  * Get an option from localStorage
  * @return {object} Option name + value
  */
function getPreference(preferenceName) {
  return { name: preferenceName, value: localStorage[preferenceName] };
}

/**
  * Initialize the right click context menu
  */
function createContextMenu() {
  if (localStorage['stylebot_option_contextMenu'] === 'true') {
    contextMenuId = chrome.contextMenus.create({
      title: 'Stylebot',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      title: 'Style Element',
      contexts: ['all'],
      onclick: function(info, tab) { sendRequestToTab(tab, 'openWidget'); },
      parentId: contextMenuId
    });

    contextMenuStatusId = chrome.contextMenus.create({
      title: 'Enable Styling',
      type: 'checkbox',
      checked: true,
      contexts: ['all'],
      onclick: function(info, tab) { sendRequestToTab(tab, 'toggleStyle'); },
      parentId: contextMenuId
    });

    chrome.contextMenus.create({
      title: 'Search for styles...',
      contexts: ['all'],
      onclick: function(info, tab) { sendRequestToTab(tab, 'searchSocial'); },
      parentId: contextMenuId
    });

    // Added onUpdated listener so we can track tab refresh
    chrome.tabs.onUpdated.addListener(updateContextMenuOnUpdated);
    // Add a selectionChanged listener so we can track changes in current tab
    chrome.tabs.onSelectionChanged.addListener(updateContextMenuOnSelectionChanged);
  }
}

/**
  *
  */
function updateContextMenuOnUpdated(tabId, changeInfo, tab) {
  if (tab.status != 'complete') return;
    updateContextMenu(tab);
}

/**
  *
  */
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
  if (tab.url.isValidUrl()) {
    // If it is a valid url, show the contextMenu
    chrome.contextMenus.update(contextMenuId, { documentUrlPatterns: ['<all_urls>'] });
    // Get style status from the tab we changed to and update the checkbox in the context menu
    chrome.tabs.sendRequest(tab.id,
      {name: 'styleStatus'},
      function(response) {
        chrome.contextMenus.update(contextMenuStatusId, { checked: response.status });
    });
  }

  else {
    // If it isn't a valid url, hide the contextMenu. Set the document pattern to foo/*random*
    chrome.contextMenus.update(contextMenuId,
      { documentUrlPatterns: ['http://foo/' + Math.random()] });
  }
}

/**
  * Remove / Hide the right click context menu
  */
function removeContextMenu() {
  if (contextMenuId) {
    chrome.tabs.onSelectionChanged.removeListener(updateContextMenuOnSelectionChanged);
    chrome.tabs.onUpdated.removeListener(updateContextMenuOnUpdated);
    chrome.contextMenus.remove(contextMenuId);
    contextMenuId = null;
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
  if (url === undefined)
    return this.styles;
  else
    return this.styles[url];
};

/**
  * Creates a new style for the given URL
  * @param {String} url URL of the new object.
  * @param {Object} rules Rules for the given URL.
  */
Styles.prototype.create = function(url, rules) {
  this.styles[url] = {};
  this.styles[url]['_enabled'] = true;
  this.styles[url]['_rules'] = rules === undefined ? {} : rules;
  this.persist();
};

/**
  * Retrieves the enabled status for the given URL
  * @param {String} url URL of the requested object.
  * @return {Boolean} The enabled status for the given URL.
  */
Styles.prototype.isEnabled = function(url) {
  if (this.styles[url] === undefined)
    return false;

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
  if (!url || url === '')
    return;

  if (rules) {
    this.create(url, rules);
    // if there is meta data, store it in the social object
    if (data !== undefined)
      this.setMetadata(url, data);
  }

  else
    this.delete(url);
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
  this.persist();
};

/**
  * If no value is given toggles the enabled status for the given URL.
  *   Otherwise, sets the enabled status for the given URL.
  * @param {String} url URL of the saved object.
  * @param {Object} value The enabled status for the given URL.
  */
Styles.prototype.toggle = function(url, value, shouldPersist) {
  if (this.isEmpty(url))
    return false;

  if (value === undefined)
    this.styles[url]['_enabled'] = !this.styles[url]['_enabled'];
  else
    this.styles[url]['_enabled'] = value;

  if (shouldPersist != false)
    this.persist();

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
  * Saves all the styles in localStorage
  */
Styles.prototype.persist = function() {
  var jsonString = JSON.stringify(this.styles);
  localStorage['stylebot_styles'] = jsonString;
};

/**
  * Imports a styles object i.e. replaces the existing styles
  *   object with the specified object
  * @param {Object} newStyles Styles object to import.
  */
Styles.prototype.import = function(newStyles) {
  for (var url in newStyles) {
    // it's the new format
    if (newStyles[url]['_rules'])
      this.styles[url] = newStyles[url];
    // old format
    else
      this.create(url, newStyles[url]);
  }
  this.persist();
};

/**
  * Merge the old object with the new one.
  * If the oldStyles parameter is given, we can use this as a
  *   static function capable of merging two styles objects together.
  * @param {Object} newStyles Styles object to merge.
  * @param {Object} oldStyles Styles object used as basis.
  * @return {Object} Merge object if the oldStyles parameter was given.
  */
Styles.prototype.merge = function(newStyles, oldStyles) {
  if (oldStyles === undefined)
    oldStyles = this.styles;

  for (var url in newStyles) {
    if (oldStyles[url]) {
      for (var selector in newStyles[url]['_rules']) {
        if (oldStyles[url]['_rules'][selector]) {
          for (var property in newStyles[url]['_rules'][selector])
          {
            oldStyles[url]['_rules'][selector][property] =
            newStyles[url]['_rules'][selector][property];
          }
        }
        else
          oldStyles[url]['_rules'][selector] = newStyles[url]['_rules'][selector];
      }
      oldStyles[url]['_social'] = newStyles[url]['_social'];
    }
    else
      oldStyles[url] = newStyles[url];
  }

  if (oldStyles === undefined)
    this.persist();
  else
    return oldStyles;
};

/**
  * Syncs the styles object i.e. pushes changes to the bookmark url
  */
Styles.prototype.push = function() {
  console.log('Pushing styles to the cloud...');
  if (cache.options.sync)
    saveSyncData(this.styles);
};

/**
  * Upgrades the style object to match the specified version
  * @param {String} version The version to upgrade to
  */
Styles.prototype.upgrade = function(version) {
  switch (version) {
    case '1.4':
      console.log('Upgrading data model for 1.4');

      for (var url in this.styles) {
        if (this.isEnabled(url) === undefined)
          this.toggle(url, true);
      }

      /* If the global stylesheet is empty after the upgrade, create it */
      if (this.isEmpty('*'))
        this.create('*');

      this.persist();
      this.push();
      break;
  }
};

/**
  * Retrieves rules for the given identifier
  * @param {String} url The given identifier.
  * @return {Object} The enabled status for the given URL.
  */
Styles.prototype.getRules = function(url) {
  if (this.styles[url] === undefined)
    return null;
  var rules = this.styles[url]['_rules'];
  return rules ? rules : null;
};

/**
  * Returns if a style exists for the URL
  * @param {String} aURL The URL to check.
  * @return {Boolean} True if any rules are associated with the URL
  */
Styles.prototype.exists = function(aURL) {
  if (this.isEnabled(aURL) && aURL !== '*')
    return true;
  else
    return false;
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

  cache.loadingTabs[tab.id] = response;

  // update page action
  if (cache.options.showPageAction) {
    if (response.rules || response.global)
      highlightPageAction(tab);
    else
      disablePageAction(tab);
    chrome.pageAction.show(tab.id);
  }

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
  else
    return this.getCombinedRulesForPage(aURL, tab);
}

/**
  * Retrieves Get all the global rules
  * @return {Object} The rules of the global stylesheet.
  */
Styles.prototype.getGlobalRules = function() {
  if (this.isEmpty('*') || !this.isEnabled('*'))
    return null;
  return this.getRules('*');
};

/**
  * Transfer rules for source URL to destination URL
  * @param {String} source Source's identifier.
  * @param {String} destination Destination's identifier.
  */
Styles.prototype.transfer = function(source, destination) {
  if (this.styles[source]) {
    this.styles[destination] = this.styles[source];
    this.persist();
  }
};

/**
  * Replace an style's identifier in place
  * @param {String} oldValue The old identifier.
  * @param {String} newValue The new identifier.
  */
Styles.prototype.replace = function(oldValue, newValue) {
  // going through a loop so that new entry is inserted at the same position
  // otherwise, on changing the url, new entry is inserted at the bottom
  var newStyles = {};
  for (var url in this.styles) {
    if (url === oldValue)
      newStyles[newValue] = this.styles[oldValue];
    else
      newStyles[url] = this.styles[url];
  }
  this.styles = newStyles;
  this.persist();
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
  /**
    * Currently, the only indicator that a string is a pattern is if
    * if thas the wildcard character *
    */
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
  * Check if Stylebot should run on a URL
  * @return {Boolean} True if Stylebot can run on the URL
  */
String.prototype.isValidUrl = function() {
  return (this.indexOf('https://chrome.google.com/webstore') === -1
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