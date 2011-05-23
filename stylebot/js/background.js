/* Background JS for Stylebot */

// Major Version. Used to check if the release notes should be shown during update
// Only updated for X.X releases
//
var CURRENT_MAJOR_VERSION = "1.3";

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
                }
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

    updateVersion();

    createContextMenu();
    attachListeners();

    if (cache.options.sync) {
        loadSyncId();
        attachSyncListeners();
    }
}

// Open release notes. Only done in case of x.x releases
//
function openReleaseNotes() {
    chrome.tabs.create({ url: "http://stylebot.me/releases", selected: true }, null);
}

// Update version string in localStorage
//
function updateVersion() {
    if (!localStorage.version) {
        updateVersionString();
        return true;
    }

    if (parseInt(localStorage.version) < 1) {
        upgradeTo1();
    }

    if (localStorage.version != CURRENT_MAJOR_VERSION) {
        updateVersionString();
        openReleaseNotes();
    }
}

function updateVersionString() {
    console.log("Updating to version " + CURRENT_MAJOR_VERSION);
    localStorage.version = CURRENT_MAJOR_VERSION;
}

// Upgrade to version 1.4
function upgradeTo1_4() {
    for (var url in cache.styles) {
        if (cache.styles[url]['_enabled'] === undefined) {
            cache.styles[url]['_enabled'] = true;
        }
    }
}

// Upgrade to version 1
// Mostly legacy code now, since almost everyone should already be updated to 1.0
//
function upgradeTo1() {
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
                console.log("Data model already at v1");
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

// Listen to requests from tabs and page action
//
function attachListeners() {

    if (cache.options.showPageAction == typeof undefined || cache.options.showPageAction) {
        showPageActions();
    }

    chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
        switch (request.name) {
            case "enablePageAction"     : if (cache.options.showPageAction) { enablePageAction(sender.tab); } sendResponse({}); break;

            case "disablePageAction"    : if (cache.options.showPageAction) { disablePageAction(sender.tab); } sendResponse({}); break;

            case "showPageActions"      : showPageActions(); sendResponse({}); break;

            case "hidePageActions"      : hidePageActions(); sendResponse({}); break;

            case "copyToClipboard"      : copyToClipboard(request.text); sendResponse({}); break;

            case "save"                 : save(request.url, request.rules, request.data); sendResponse({}); break;

            case "doesStyleExist"       : sendResponse(doesStyleExist(request.url)); break;

            case "transfer"             : transfer(request.source, request.destination); sendResponse({}); break;

            case "getGlobalRules"       : sendResponse(getGlobalRules()); break;

            case "getRulesForPage"      : sendResponse(getRulesForPage(request.url)); break;

            case "fetchOptions"         : sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case "saveAccordionState"   : saveAccordionState(request.enabledAccordions); sendResponse({}); break;

            case "savePreference"       : savePreference(request.preference); sendResponse({}); break;

            case "getPreference"        : sendResponse(getPreference(request.preferenceName)); break;

            case "pushStyles"           : pushStyles(); sendResponse({}); break;
        }
    });
}


// Toggle CSS editing when page icon is clicked
//
function onPageActionClick(tab) {
    chrome.tabs.sendRequest(tab.id, { name: "toggle" }, function(response) {
        if(response.status)
            enablePageAction(tab);
        else
            disablePageAction(tab);
    });
}

function refreshPageAction(tab) {
    chrome.tabs.sendRequest(tab.id, { name: "status" }, function(response) {
        if(response.status)
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
        chrome.pageAction.setIcon({ tabId: tab.id, path: "images/css_highlighted.png" });
    }

    else {
        chrome.pageAction.setIcon({ tabId: tab.id, path: "images/css.png" });
    }

    chrome.pageAction.setTitle({ tabId: tab.id, title: "Click to start editing using Stylebot" });
}

// Update page action to indicate that stylebot is visible
//
function enablePageAction(tab) {
    chrome.pageAction.setIcon({ tabId: tab.id, path: "images/css_active.png" });
    chrome.pageAction.setTitle({ tabId: tab.id, title: "Click to stop editing using Stylebot" });
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

                    if (tab.url.match("^http") == "http"
                    && tab.url.indexOf("https://chrome.google.com/extensions") == -1)
                    {
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
    if (tab.url.match("^http") == "http" && tab.url.indexOf("https://chrome.google.com/extensions") == -1) {
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
    if (!url || url == "")
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

// Update styles in localStorage
function updateStylesInDataStore() {
    var jsonString = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = jsonString;
}

// Load styles from localStorage into cache
function loadStylesIntoCache() {
    if (localStorage['stylebot_styles']) {
        try {
            cache.styles = JSON.parse(localStorage['stylebot_styles']);
        }
        catch(e) {
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
            if (dataStoreValue == "true" || dataStoreValue == "false")
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
    if (name === "contextMenu" && value === false)
        removeContextMenu();
    else if (!contextMenuId)
        createContextMenu();
}

// Returns if a style already exists for the given page
//
function doesStyleExist(aURL) {
    for (var url in cache.styles)
    {
        if (!cache.styles[url]['_enabled']) continue;
        if (aURL.trim().indexOf(url) != -1) {
            return true;
        }
    }

    return false;
}

// Return CSS rules for websites
function getGlobalRules() {
    var rules = {};
                   
    // iterate over each selector in styles
    for (var selector in cache.styles["*"]['_rules']) {
        // if no rule exists for selector, simply copy the rule
        if (rules[selector] == undefined)
            rules[selector] = cloneObject(cache.styles["*"]['_rules'][selector]);

        // otherwise, iterate over each property
        else {
            for (var property in cache.styles["*"]['_rules'][selector])
            {
                rules[selector][property] = cache.styles["*"]['_rules'][selector][property];
            }
        }
    }
    if (rules != undefined)
        return {rules: rules};
    else
        return {rules: null};
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
        
        var subUrls = url.split(',');
        var len = subUrls.length;
        var isFound = false;

        for (var i = 0; i < len; i++)
        {
            if (currUrl.indexOf(subUrls[i].trim()) != -1) {
                isFound = true;
                break;
            }
        }

        if (isFound)
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
    sendRequestToAllTabs({ name: 'setOptions', options: cache.options }, function(){});
}

// Send request to all opened tabs
function sendRequestToAllTabs(req){
    chrome.windows.getAll({ populate: true }, function(windows) {
        var w_len = windows.length;

        for (var i = 0; i < w_len; i++)
        {
            var t_len = windows[i].tabs.length;
            for (var j = 0; j < t_len; j++)
            {
                chrome.tabs.sendRequest(windows[i].tabs[j].id, req, function(response){});
            }
        }
    });
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
            title: "Stylebot",
            contexts: ['all']
        });

        chrome.contextMenus.create({
            title: "Style Element",
            contexts: ['all'],
            onclick: function(info, tab) { sendRequestToTab(tab, "openWidget"); },
            parentId: contextMenuId
        });

        contextMenuStatusId = chrome.contextMenus.create({
            title: "Enable Styling",
            type: "checkbox",
            checked: true,
            contexts: ['all'],
            onclick: function(info, tab) { sendRequestToTab(tab, "toggleStyle"); },
            parentId: contextMenuId
        });

        chrome.contextMenus.create({
            title: "Search for styles...",
            contexts: ['all'],
            onclick: function(info, tab) { sendRequestToTab(tab, "searchSocial"); },
            parentId: contextMenuId
        });

        // Added onUpdated listener so we can track tab refresh
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
            chrome.contextMenus.update(contextMenuStatusId, {checked: true});
        });

        // Add a selectionChanged listener so we can track changes in current tab
        chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
            // Get style status from the tab we changed to and update the checkbox in the context menu
            chrome.tabs.sendRequest(tabId, { name: "styleStatus" }, function(response) {
                chrome.contextMenus.update(contextMenuStatusId, {checked: response.status});
            });
        });
    }
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

// Remove the right click context menu
function removeContextMenu() {
    if (contextMenuId) {
        chrome.contextMenus.remove(contextMenuId);
        contextMenuId = null;
    }
}

window.addEventListener('load', function(){
    init();
});

// Utility methods

// Trim a string
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

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
        if (obj[i] && typeof obj[i] == "object") {
            newObj[i] = cloneObject(obj[i]);
        }

        else
            newObj[i] = obj[i]
    }

    return newObj;
};