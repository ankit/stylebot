/* Background JS for Stylebot */

var CURRENT_VERSION = '1.4.2';

var currTabId;
var contextMenuId = null;

var cache = {
    /**
        e.g. styles = {
            'google.com' : {

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
    **/
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
    enabledAccordions: [0, 1, 2, 3]
};


// Initialize
//
function init() {
    loadOptionsIntoCache();
    loadStylesIntoCache();
    console.log(cache.styles);
    loadAccordionState();
    updateVersion();

    createContextMenu();
    attachListeners();

    if (cache.options.sync) {
        loadSyncId();
        attachSyncListeners();
    }
}

// Update version string in localStorage
//
function updateVersion() {
    if (!localStorage.version) {
        updateVersionString();
        return true;
    }
    if (localStorage.version != CURRENT_VERSION) {
        // let's keep this for 1.4.x, for any users who jump from 1.3.x
        // versions to the current version
        if (parseFloat(CURRENT_VERSION) === 1.4) {
            cache.styles.upgrade('1.4');
        }
        // only show notification for X.X updates
        if (parseFloat(localStorage.version) < parseFloat(CURRENT_VERSION)) {
            showUpdateNotification();
        }
        // update version string in localStorage
        updateVersionString();
    }
}

function updateVersionString() {
    console.log('Updating to version ' + CURRENT_VERSION);
    localStorage.version = CURRENT_VERSION;
}

// Show a notification popup to notify user of update
//
function showUpdateNotification() {
    var notification = webkitNotifications.createHTMLNotification(
      'notification.html'
    );

    notification.show();
}

// Listen to requests from tabs and page action
//
function attachListeners() {

    if (cache.options.showPageAction == typeof undefined || cache.options.showPageAction) {
        showPageActions();
    }

    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        switch (request.name) {
            case 'enablePageAction'     : if (cache.options.showPageAction) { enablePageAction(sender.tab); } sendResponse({}); break;

            case 'disablePageAction'    : if (cache.options.showPageAction) { disablePageAction(sender.tab); } sendResponse({}); break;

            case 'showPageActions'      : showPageActions(); sendResponse({}); break;

            case 'hidePageActions'      : hidePageActions(); sendResponse({}); break;

            case 'copyToClipboard'      : request.text.copyToClipboard(); sendResponse({}); break;

            case 'save'                 : cache.styles.save(request.url, request.rules, request.data); sendResponse({}); break;

            case 'doesStyleExist'       : sendResponse(cache.styles.exists(request.url)); break;

            case 'transfer'             : cache.styles.transfer(request.source, request.destination); sendResponse({}); break;

            case 'getGlobalRules'       : sendResponse(cache.styles.getGlobalRules()); break;

            case 'getRulesForPage'      : sendResponse(cache.styles.getRulesForPage(request.url)); break;

            case 'fetchOptions'         : sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case 'saveAccordionState'   : saveAccordionState(request.enabledAccordions); sendResponse({}); break;

            case 'savePreference'       : savePreference(request.preference); sendResponse({}); break;

            case 'getPreference'        : sendResponse(getPreference(request.preferenceName)); break;

            case 'pushStyles'           : cache.styles.push(); sendResponse({}); break;
        }
    });
}


// Toggle CSS editing when page icon is clicked
//
function onPageActionClick(tab) {
    chrome.tabs.sendRequest(tab.id, { name: 'toggle' }, function(response) {
        if (response.status)
            enablePageAction(tab);
        else
            disablePageAction(tab);
    });
}

function refreshPageAction(tab) {
    chrome.tabs.sendRequest(tab.id, { name: 'status' }, function(response) {
        if (response.status)
            enablePageAction(tab);
        else
            disablePageAction(tab);
    });
}

// Update page action to indicate that stylebot is not visible
//
function disablePageAction(tab) {
    // if a style is applied to the current page
    //
    if (cache.styles.exists(tab.url)) {
        chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css_highlighted.png' });
    }
    else {
        chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css.png' });
    }

    chrome.pageAction.setTitle({ tabId: tab.id, title: 'Click to start editing using Stylebot' });
}

// Update page action to indicate that stylebot is visible
//
function enablePageAction(tab) {
    chrome.pageAction.setIcon({ tabId: tab.id, path: 'images/css_active.png' });
    chrome.pageAction.setTitle({ tabId: tab.id, title: 'Click to stop editing using Stylebot' });
}

// Show page action for all tabs where it is applicable
//
function showPageActions() {
    chrome.windows.getAll({ populate: true }, function(windows) {
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

    chrome.pageAction.onClicked.addListener(onPageActionClick);
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onSelectionChanged.addListener(onTabSelectionChanged);
}

// Hide page action on all tabs
//
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
    chrome.tabs.onUpdated.removeListener(onTabUpdated);
    chrome.tabs.onSelectionChanged.removeListener(onTabSelectionChanged);
}


// Update the page action as soon as the tab gets updated, but only once per
// tab to avoid bad performance. The tab.status should be different from
// complete.
function onTabUpdated(tabId, changeInfo, tab) {
    if (tab.status != 'complete' && tab.url.isValidUrl()) {
        chrome.pageAction.show(tabId);
        disablePageAction(tab);
    }
}

function onTabSelectionChanged(tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tab) {
        refreshPageAction(tab);
    });
}

// Save all styles. Used by Sync.js
function saveStyles(styles) {
    cache.styles = new Styles(styles);
    cache.styles.persist();
}

// Merge styles, for common properties, oldStyle is given priority
// Used by Sync.js
function mergeStyles(newStyles, oldStyles) {
    cache.styles.merge(newStyles, oldStyles);
}

// Load styles from localStorage into cache
//
function loadStylesIntoCache() {
    if (localStorage['stylebot_styles']) {
        try {
            cache.styles = new Styles(JSON.parse(localStorage['stylebot_styles']));
        }
        catch (e) {
            console.log(e);
            cache.styles = new Styles({});
        }
    }
}

// Load options from localStorage into background cache
function loadOptionsIntoCache() {
    for (var option in cache.options)
    {
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

// Save an option
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

// Return CSS rules for websites
function getGlobalRules() {
    return cache.styles.getGlobalRules();
}

// Propagate options to all open tabs
function propagateOptions() {
    sendRequestToAllTabs({ name: 'setOptions', options: cache.options }, function() {});
}

// Save current accordion state into cache
function saveAccordionState(enabledAccordions) {
    cache.enabledAccordions = enabledAccordions;
    localStorage['stylebot_enabledAccordions'] = enabledAccordions;
}

// Load previous accordion state into cache
function loadAccordionState() {
    if (localStorage['stylebot_enabledAccordions'])
        cache.enabledAccordions = localStorage['stylebot_enabledAccordions'].split(',');
}

function savePreference(preference) {
    localStorage[preference.name] = preference.value;
}

function getPreference(preferenceName) {
    return { name: preferenceName, value: localStorage[preferenceName] };
}

// Initialize the right click context menu
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

function updateContextMenuOnUpdated(tabId, changeInfo, tab) {
    if (tab.status != 'complete') return;
    updateContextMenu(tab);
}

function updateContextMenuOnSelectionChanged(tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tab) {
        updateContextMenu(tab);
    });
}

// Updates context menu for a tab: show/hide, update checkboxes
function updateContextMenu(tab) {
    if (tab.url.isValidUrl()) {
        // If it is a valid url, show the contextMenu
        chrome.contextMenus.update(contextMenuId, { documentUrlPatterns: ['<all_urls>'] });
        // Get style status from the tab we changed to and update the checkbox in the context menu
        chrome.tabs.sendRequest(tab.id, { name: 'styleStatus' }, function(response) {
            chrome.contextMenus.update(contextMenuStatusId, { checked: response.status });
        });
    } else {
        // If it isn't a valid url, hide the contextMenu. Set the document pattern to foo/*random*
        chrome.contextMenus.update(contextMenuId, { documentUrlPatterns: ['http://foo/' + Math.random()] });
    }
}

// Remove the right click context menu
function removeContextMenu() {
    if (contextMenuId) {
        chrome.tabs.onSelectionChanged.removeListener(updateContextMenuOnSelectionChanged);
        chrome.tabs.onUpdated.removeListener(updateContextMenuOnUpdated);
        chrome.contextMenus.remove(contextMenuId);
        contextMenuId = null;
    }
}

// Send request to all opened tabs
function sendRequestToAllTabs(req) {
    chrome.windows.getAll({ populate: true }, function(windows) {
        var w_len = windows.length;

        for (var i = 0; i < w_len; i++)
        {
            var t_len = windows[i].tabs.length;
            for (var j = 0; j < t_len; j++)
            {
                chrome.tabs.sendRequest(windows[i].tabs[j].id, req, function(response) {});
            }
        }
    });
}

// Send a request to tab
function sendRequestToTab(tab, msg) {
    chrome.tabs.sendRequest(tab.id, { name: msg }, function() {});
}

window.addEventListener('load', function() {
    init();
});

/**
 * Styles object used by background.js
 * @constructor
 * @param {Object} param Styles objects.
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
 * If no url is given, returns all the style objects
 * @param {String} url The URL of the requested object.
 * @return {Object} The request style(s) object(s).
 */
Styles.prototype.get = function(url) {
    if (url === undefined) {
        return this.styles;
    }
    else {
        return this.styles[url];
    }
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
    return this.styles[url]['_enabled'];
};

/**
 * Saves the given rules and metadata inside the style for the given URL.
 * If no rules are given, the given URL style is deleted.
 * @param {String} url URL of the saved object.
 * @param {Object} rules rules New rules for the given URL.
 * @param {Object} data New metadata for the given URL.
 */
Styles.prototype.save = function(url, rules, data) {
    if (!url || url == '')
        return;

    if (rules) {
        this.create(url, rules);
        // if there is meta data, store it in the social object
        if (data !== undefined) {
            this.setMetadata(url, data);
        }
    }
    else {
        this.delete(url);
    }
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
 * Otherwise, sets the enabled status for the given URL.
 * @param {String} url URL of the saved object.
 * @param {Object} value The enabled status for the given URL.
 */
Styles.prototype.toggle = function(url, value, shouldPersist) {
    if (this.isEmpty(url)) return;

    if (value === undefined) {
        this.styles[url]['_enabled'] = !this.styles[url]['_enabled'];
    } else {
        this.styles[url]['_enabled'] = value;
    }
    
    if (shouldPersist != false)
        this.persist();
};

/**
 * If no value is given toggles the enabled status for all the styles.
 * Otherwise, sets the enabled status for all the styles.
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
 * Imports an styles object
 * @param {Object} newStyles Styles object to import.
 */
Styles.prototype.import = function(newStyles) {
    for (var url in newStyles) {
        // it's the new format
        if (newStyles[url]['_rules']) {
            this.styles[url] = newStyles[url];
        }
        // old format
        else {
            this.create(url, newStyles[url]);
        }
    }
    this.persist();
};

/**
 * Merge the old object with the new one.
 * If the oldStyles parameter is given, we can use this as an static function
 * capable of merging two styles objects together.
 * @param {Object} newStyles Styles object to merge.
 * @param {Object} oldStyles Styles object used as basis.
 * @return {Object} Merge object if the oldStyles parameter was given.
 */
Styles.prototype.merge = function(newStyles, oldStyles) {
    if (oldStyles === undefined) {
        oldStyles = this.styles;
    }
    for (var url in newStyles) {
        if (oldStyles[url]) {
            for (var selector in newStyles[url]['_rules']) {
                if (oldStyles[url]['_rules'][selector]) {
                    for (var property in newStyles[url]['_rules'][selector]) {
                        oldStyles[url]['_rules'][selector][property] = newStyles[url]['_rules'][selector][property];
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
    if (oldStyles === undefined) {
        this.persist();
    }
    else {
        return oldStyles;
    }
};

/**
 * Syncs the styles object
 */
Styles.prototype.push = function() {
    if (cache.options.sync) {
        saveSyncData(this.styles);
    }
};

/**
 * Upgrades the style object to match the current version
 * @param {String} version The version to upgrade for.
 */
Styles.prototype.upgrade = function(version) {
    switch (version) {
        case '1.4':
            console.log('Upgrading data model for 1.4');

            for (var url in this.styles)
            {
                if (this.isEnabled(url) === undefined) {
                    this.toggle(url, true);
                }
            }

            /* If the global stylesheet is empty after the upgrade, create it */
            if (this.isEmpty('*')) {
                this.create('*');
            }

            // save the updated styles in localStorage
            this.persist();
        break;
    }
};

/**
 * Retrieves rules for the given identifier
 * @param {String} url The given identifier.
 * @return {Object} The enabled status for the given URL.
 */
Styles.prototype.getRules = function(url) {
    var rules = this.styles[url]['_rules'];
    return rules ? rules : null;
};

/**
 * Returns if a style already exists for the given page
 * @param {String} aURL The URL to check.
 * @return {Boolean} True if it has rules associated.
 */
Styles.prototype.exists = function(aURL) {
    for (var url in this.styles)
    {
        if (!this.isEnabled(url)) continue;
        if (url === '*') continue;
        if (aURL.matchesPattern(url))
            return true;
    }
    return false;
};

/**
 * Retrieves all the CSS rules for the given URL
 * @param {String} aURL The URL to retrieve the rules for.
 * @return {Object} rules: The rules. url: The identifier representing the URL.
 */
Styles.prototype.getRulesForPage = function(aURL) {
    // this will contain the combined set of evaluated rules to be applied to
    // the page. longer, more specific URLs get the priority for each selector
    // and property
    var rules = {};
    var url_for_page = '';

    for (var url in this.styles)
    {
        if (!this.isEnabled(url) || url === '*') continue;
        console.log(url, aURL.matchesPattern(url));
        if (aURL.matchesPattern(url))
        {
            if (url.length > url_for_page.length)
                url_for_page = url;

            // iterate over each selector in styles
            var urlRules = this.getRules(url);
            console.log(urlRules);
            for (var selector in urlRules) {

                // if no rule exists for selector, simply copy the rule
                if (rules[selector] == undefined)
                    rules[selector] = cloneObject(urlRules[selector]);

                // otherwise, iterate over each property
                else {
                    for (var property in urlRules[selector])
                    {
                        if (rules[selector][property] == undefined || url == url_for_page)
                            rules[selector][property] = urlRules[selector][property];
                    }
                }
            }
        }
    }
    
    if (rules != undefined)
        return {rules: rules, url: url_for_page};
    else
        return {rules: null, url: null};
};

/**
 * Retrieves all the global rules
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
    if (this.styles[source])
    {
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
        if (url == oldValue) {
            newStyles[newValue] = this.styles[oldValue];
        }
        else {
            newStyles[url] = this.styles[url];
        }
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
    console.log('Matches Pattern calls');
    if (pattern.isPattern()) {
        var hasComma = ~pattern.indexOf(',');
        pattern = pattern.
                /* Removes white spaces */
                replace(/ /g, '').
                /* Escapes . ? | ( ) [ ] + $ ^ \ { } */
                replace(/(\.|\?|\||\(|\)|\[|\]|\+|\$|\^|\\|\{|\})/g, '\\$1').
                /* Allows commas to be used to separate urls */
                replace(/,/g, '|').
                /* Allows use of the * wildcard */
                replace(/\*/g, '.*');
        /* Enclose the pattern in ( ) if it has several urls separated by , */
        pattern = (hasComma ? '(' + pattern + ')' : pattern);
        /* Matches the beginning of the url */
        pattern = '^.+?://' + pattern;
        pattern = new RegExp(pattern, 'i');
        return pattern.test(this);
    } else {
        return this.matchesBasic(pattern);
    }
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
    for (var i = 0; i < len; i++)
    {
        if (this.indexOf(subUrls[i].trim()) != -1) {
            isFound = true;
            break;
        }
    }
    return isFound;
};

/**
 * Check if an url is a valid one
 * @return {Boolean} True if the string is a valid url, false otherwise.
 */
String.prototype.isValidUrl = function() {
    return (this.match('^http') == 'http' &&
        this.indexOf('https://chrome.google.com/webstore') == -1);
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
        if (obj[i] && typeof obj[i] == 'object') {
            newObj[i] = cloneObject(obj[i]);
        }

        else
            newObj[i] = obj[i];
    }

    return newObj;
}
