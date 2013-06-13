/**
  * Background Page
  */
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
    livePreviewColorPicker: true,
    livePreviewPage: true,
    showPageAction: true,
    accordions: [0, 1, 2, 3]
  },

  importRules: {},

  // Temporary cached map of tabId to rules to prevent recalculating rules
  // for iframes. Cleared when a tab finishes loading or a tab is closed.
  loadingTabs: []
};

// Initialize.
function init() {
  updateVersion(function() {
    initCache(function() {
      ContextMenu.init();
    });
  });

  PageAction.showAll();
  attachListeners();
}

/**
  * Attaches listeners to act on requests sent from tabs and page action
  */
function attachListeners() {
  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.tabs.onActivated.addListener(onTabActivated);
  chrome.tabs.onRemoved.addListener(onTabRemoved);

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
    switch (request.name) {
      case 'activatePageAction':
        PageAction.activate(sender.tab);
        sendResponse({});
        break;

      case 'unhighlightPageAction':
        PageAction.unhighlight(sender.tab);
        sendResponse({});
        break;

      case 'highlightPageAction':
        PageAction.highlight(sender.tab);
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

      case 'fetchImportCSS':
        cache.styles.fetchImportCSS(request.url, function(css) {
          sendResponse({text: css});
        });
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
      ContextMenu.update(tab);
    }
  }
}

function onTabActivated(activeInfo) {
  if (cache.options.contextMenu) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      ContextMenu.update(tab);
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
  * Merge styles
  * @param {array} newStyles The styles that should be merged.
  * @param {array} oldStyles The styles to merge into.
  *   This is given higher priority over a new style for the same selector
  */
function mergeStyles(newStyles, oldStyles) {
  cache.styles.merge(newStyles, oldStyles);
}


function initCache(callback) {
  chrome.storage.local.get(['options', 'styles'], function(items) {
    if (items['options']) {
      cache.options = items['options'];
    }

    if (items['styles']) {
      cache.styles = new Styles(items['styles']);
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

  // If the option was contextMenu, update it
  if (name === 'contextMenu') {
    if (value === false) {
      ContextMenu.remove();
    } else {
      ContextMenu.init();
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

// Clone an object
// http://my.opera.com/GreyWyvern/blog/show.dml/1725165
function cloneObject(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (obj[i] && typeof obj[i] == 'object')
      newObj[i] = cloneObject(obj[i]);
    else
      newObj[i] = obj[i];
  }
  return newObj;
};

function isEmptyObject(obj) {
  var isEmpty = true;
  for(keys in obj) {
     isEmpty = false;
     break;
  }
  return isEmpty;
};

init();
