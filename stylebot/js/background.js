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
    loadAccordionState();
    console.log(cache.styles);
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
        // let's keep this for 1.4.x, for any users who jump from 1.3.x versions to the current version
        //
        if (parseFloat(CURRENT_VERSION) === 1.4) {
            upgradeTo1_4();
        }
        
        // only show notification for X.X updates
        if (parseFloat(localStorage.version) < parseFloat(CURRENT_VERSION))
        {
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

// Upgrade to version 1.4
//
function upgradeTo1_4() {
    console.log('Upgrading data modal for 1.4');
    
    for (var url in cache.styles)
    {
        if (cache.styles[url]['_enabled'] === undefined) {
            cache.styles[url]['_enabled'] = true;
        }
    }
    
    /* If the global stylesheet is empty after the upgrade, let's create it */
    if (!cache.styles['*']) {
        cache.styles['*'] = {};
        cache.styles['*']['_enabled'] = true;
        cache.styles['*']['_rules'] = {};
    }
    
    // save the updated styles in localStorage
    updateStylesInDataStore();
}

// Upgrade to version 1
// @deprecated Far too ahead in the release cycle :)
//
function upgradeTo1() {
    console.log('Upgrading data modal for 1');
    var first = false;

    // upgrading to the new data model
    for (var url in cache.styles) {

        // if it is already in the new format, do nothing
        // this may happen when sync is enabled
        // and upgrade is taking place after an upgrade has already taken place at another computer

        if (!first) {
            first = cache.styles[url];
            // ideally, there should me a more foolproof check
            if (first['_rules']) {
                console.log('Data model already at v1');
                return;
            }
        }

        var rules = cache.styles[url];
        cache.styles[url] = {};
        cache.styles[url]['_enabled'] = true;
        cache.styles[url]['_rules'] = rules;
    }

    // save to localStorage
    updateStylesInDataStore();

    // update data in bookmark as well
    pushStyles();
}

// Open release notes
//
function openReleaseNotes() {
    chrome.tabs.create({ url: 'http://stylebot.me/releases', selected: true }, null);
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

            case 'copyToClipboard'      : copyToClipboard(request.text); sendResponse({}); break;

            case 'save'                 : save(request.url, request.rules, request.data); sendResponse({}); break;

            case 'doesStyleExist'       : sendResponse(doesStyleExist(request.url)); break;

            case 'transfer'             : transfer(request.source, request.destination); sendResponse({}); break;

            case 'getGlobalRules'       : sendResponse(getGlobalRules()); break;

            case 'getRulesForPage'      : sendResponse(getRulesForPage(request.url)); break;

            case 'fetchOptions'         : sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case 'saveAccordionState'   : saveAccordionState(request.enabledAccordions); sendResponse({}); break;

            case 'savePreference'       : savePreference(request.preference); sendResponse({}); break;

            case 'getPreference'        : sendResponse(getPreference(request.preferenceName)); break;

            case 'pushStyles'           : pushStyles(); sendResponse({}); break;
        }
    });
}

/**
 *  Page Action stuff
 */
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
    if (doesStyleExist(tab.url)) {
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

function onTabUpdated(tabId, changeInfo, tab) {
    if (tab.url.isValidUrl()) {
        chrome.pageAction.show(tabId);
        disablePageAction(tab);
    }
}

function onTabSelectionChanged(tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tab) {
        refreshPageAction(tab);
    });
}

// Save all rules for a page
function save(url, rules, data) {
    if (!url || url == '')
        return;

    if (rules) {
        cache.styles[url] = {};
        cache.styles[url]['_rules'] = rules;
        cache.styles[url]['_enabled'] = true;
    }

    else
        delete cache.styles[url];

    // if there is meta data, store it in the social object
    if (data != undefined) {
        cache.styles[url]['_social'] = {};
        cache.styles[url]['_social'].id = data.id;
        cache.styles[url]['_social'].timestamp = data.timestamp;
    }

    updateStylesInDataStore();
}

// Transfer rules for source URL to destination URL
function transfer(source, destination) {
    if (cache.styles[source])
    {
        cache.styles[destination] = cache.styles[source];
        updateStylesInDataStore();
    }
}

// Save all styles
function saveStyles(styles) {
    if (styles)
        cache.styles = styles;
    
    updateStylesInDataStore();
}

// Save all styles in localStorage and cache
function saveStylesLocally(styles) {
    if (styles)
        cache.styles = styles;
    var jsonString = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = jsonString;
}

// Styles from both objects are merged
// for common properties, s2 is given priority over s1
//
function mergeStyles(s1, s2) {
    if (!s2) {
        return s1;
    }

    for (var url in s1) {
        if (s2[url]) {
            for (var selector in s1[url]['_rules']) {
                if (s2[url]['_rules'][selector]) {
                    for (var property in s1[url]['_rules'][selector]) {
                        s2[url]['_rules'][selector][property] = s1[url]['_rules'][selector][property];
                    }
                }
                else
                    s2[url]['_rules'][selector] = s1[url]['_rules'][selector];
            }
            s1[url]['_social'] = s2[url]['_social'];
        }
        else
            s2[url] = s1[url];
    }

    return s2;
}

// Update styles in localStorage with styles from cache
//
function updateStylesInDataStore() {
    var jsonString = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = jsonString;
}

// Load styles from localStorage into cache
//
function loadStylesIntoCache() {
    if (localStorage['stylebot_styles']) {
        try {
            cache.styles = JSON.parse(localStorage['stylebot_styles']);
        }
        catch (e) {
            console.log(e);
            cache.styles = {};
        }
    }
}

// If sync is enabled, push styles to cloud
function pushStyles() {
    if (cache.options.sync) {
        saveSyncData(cache.styles);
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

// Returns if a style already exists for the given page
//
function doesStyleExist(aURL) {
    var shouldPattern = (aURL.match("^http") == "http");

    if (shouldPattern) {
        for (var url in cache.styles)
        {
            if (url === '*' && !cache.styles['*']['_rules']) continue;
            if (!cache.styles[url]['_enabled']) continue;
            if (aURL.matchesPattern(url)) {
                return true;
            }
        }
    } else {
        for (var url in cache.styles)
        {
            if (url === aURL) return true;
        }
    }
    return false;
}

// Return CSS rules for websites
function getGlobalRules() {
    if (cache.styles['*'] === undefined || !cache.styles['*']['_enabled'])
        return null;
    return cache.styles['*']['_rules'];
}

// Return CSS rules for a URL
function getRulesForPage(currUrl) {
    // this will contain the combined set of evaluated rules to be applied to the page.
    // longer, more specific URLs get the priority for each selector and property
    var rules = {};
    var url_for_page = '';

    for (var url in cache.styles)
    {
        if (!cache.styles[url]['_enabled']) continue;
        if (url === '*') continue;
        
        if (currUrl.matchesPattern(url))
        {
            if (url.length > url_for_page.length)
                url_for_page = url;

            // iterate over each selector in styles
            for (var selector in cache.styles[url]['_rules']) {

                // if no rule exists for selector, simply copy the rule
                if (rules[selector] == undefined)
                    rules[selector] = cloneObject(cache.styles[url]['_rules'][selector]);

                // otherwise, iterate over each property
                else {
                    for (var property in cache.styles[url]['_rules'][selector])
                    {
                        if (rules[selector][property] == undefined || url == url_for_page)
                            rules[selector][property] = cache.styles[url]['_rules'][selector][property];
                    }
                }
            }
        }
    }

    if (rules != undefined)
        return {rules: rules, url: url_for_page};
    else
        return {rules: null, url: null};
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
    if (tab.status != "complete") return;
    updateContextMenu(tab);
}

function updateContextMenuOnSelectionChanged(tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tab) {
        updateContextMenu(tab);
    });
}
      
// Updates context menu for a tab: show/hide, update checkboxes
function updateContextMenu(tab) {
    if (tab.url.isValidUrl()){
        // If it is a valid url, show the contextMenu
        chrome.contextMenus.update(contextMenuId, { documentUrlPatterns: ['<all_urls>'] });
        // Get style status from the tab we changed to and update the checkbox in the context menu
        chrome.tabs.sendRequest(tab.id, { name: 'styleStatus' }, function(response) {
            chrome.contextMenus.update(contextMenuStatusId, { checked: response.status });
        });
    } else {
        // If it isn't a valid url, hide the contextMenu. Set the document pattern to foo/*random*
        chrome.contextMenus.update(contextMenuId, { documentUrlPatterns: ['http://foo/'+Math.random()] });
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

/**
 * Tab Communication stuff
 */
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

// @Deprecated: Send a request to the current selected tab
function sendRequestToCurrentTab(msg) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, { name: msg }, function() {});
    });
}

window.addEventListener('load', function() {
    init();
});

// Utility methods

/**
 * Trims a string
 * @return {String} The trimmed string.
 */
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

/**
 * Checks if the string matches an stylebot pattern
 * @param {String} pattern The stylebot pattern.
 * @return {Boolean} True if the string matches the patern, false otherwise.
 */
String.prototype.matchesPattern = function(pattern) {
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
};

/**
 * Check if an url is a valid one
 * @return {Boolean} True if the string is a valid url, false otherwise.
 */
String.prototype.isValidUrl = function() {
    return (this.match('^http') == 'http' &&
        this.indexOf('https://chrome.google.com/webstore') == -1);
}

// Copy to Clipboard
function copyToClipboard(text) {
    var copyTextarea = document.createElement('textarea');
    document.body.appendChild(copyTextarea);
    copyTextarea.value = text;
    copyTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(copyTextarea);
}

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
