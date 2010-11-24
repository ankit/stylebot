/* Background JS for Stylebot */

var currTabId;

var cache = {
    /**
        e.g. styles = {
            'google.com' : {
                'a': {
                    'color': 'red'
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
        sync: false
    },
    
    // indices of enabled accordions. be default, all are enabled
    enabledAccordions: [0, 1, 2, 3]
};

function init() {
    updateVersion();
    attachListeners();
    loadOptionsIntoCache();
    loadStylesIntoCache();
    loadAccordionState();
    if (cache.options.sync) {
        loadSyncId();
        attachSyncListeners();
    }
}

function openReleaseNotes() {
    chrome.tabs.create({url:"http://stylebot.me/releases.html", selected: true}, null);
}

function updateVersion() {
    if (!localStorage.version) {
        localStorage.version = "0.2"; return true;
    }
    else if (localStorage.version != "0.2") {
        // display notification on update
        var notification = webkitNotifications.createHTMLNotification(
          'notification.html'
        );
        notification.show();
        localStorage.version = "0.2";
    }
    initContextMenu();
}

function attachListeners() {
    chrome.pageAction.onClicked.addListener(handlePageIconClick);
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (tab.url.match("^http") == "http" && tab.url.indexOf("https://chrome.google.com/extensions") == -1)
            chrome.pageAction.show(tabId);
    });
    
    chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
        switch (request.name) {
            case "enablePageIcon"   : enablePageIcon(sender.tab.id); sendResponse({}); break;
            
            case "disablePageIcon"  : disablePageIcon(sender.tab.id); sendResponse({}); break;
            
            case "copyToClipboard"  : copyToClipboard(request.text); sendResponse({}); break;
            
            case "save"             : save(request.url, request.rules); sendResponse({}); break;

            case "transfer"         : transfer(request.source, request.destination); sendResponse({}); break;
            
            case "getRulesForPage"  : sendResponse(getRulesForPage(request.url)); sendResponse({}); break;
            
            case "fetchOptions"     : sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case "saveAccordionState": saveAccordionState(request.enabledAccordions); sendResponse({}); break;

            case "pushStyles": pushStyles(); sendResponse({}); break;
        }
    });
}

/** Page Action handling **/

// Toggle CSS editing when page icon is clicked
function handlePageIconClick(tab) {
    currTabId = tab.id;
    chrome.tabs.sendRequest(currTabId, { name: "toggle" }, function(response){
        if(response.status)
            enablePageIcon(currTabId);
        else
            disablePageIcon(currTabId);
    });
}

function enablePageIcon(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: "images/icon19_on.png" });
    chrome.pageAction.setTitle({ tabId: tabId, title: "Click to stop editing using Stylebot" });
}

function disablePageIcon(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: "images/icon19_off.png" });
    chrome.pageAction.setTitle({ tabId: tabId, title: "Click to start editing using Stylebot" });
}

/** End of Page Action Handling **/

/** Data save, load, etc. **/

// save rule. ** not being used
function saveRule(url, selector, rule) {
    if (!selector || selector == "" || !url || url == "")
        return false;
    
    if (rule) {
        if (!cache.styles[url])
            cache.styles[url] = new Object();
        cache.styles[url][selector] = rule;
    }
    else {
        if (cache.styles[url] && cache.styles[url][selector])
            delete cache.styles[url][selector];
    }
    updateStylesInDataStore();
}

// save all rules for a page
function save(url, rules) {
    if (!url || url == "")
        return;
    if (rules)
        cache.styles[url] = rules;
    else
        delete cache.styles[url];
    updateStylesInDataStore();
}

// transfer rules for source URL to destination URL
function transfer(source, destination) {
    if (cache.styles[source]) {
        cache.styles[destination] = cache.styles[source];
        // the user has to delete the styles for the previous url manually
        // if (destination.indexOf(source) == -1)
        //     delete cache.styles[source];
        updateStylesInDataStore();
    }
}

// save all styles
function saveStyles(styles) {
    if (styles)
        cache.styles = styles;
    updateStylesInDataStore();
}

// save all styles only in localStorage and cache
function saveStylesLocally(styles) {
    if (styles)
        cache.styles = styles;
    var jsonString = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = jsonString;
}

// styles from both objects are merged
// for common properties, s2 is given priority over s1
function mergeStyles(s1, s2) {
    if (!s2) {
        return s1;
    }
    for (var url in s1) {
        if (s2[url]) {
            for (var selector in s1[url]) {
                if (s2[url][selector]) {
                    for (var property in s1[url][selector]) {
                        s2[url][selector][property] = s1[url][selector][property];
                    }
                }
                else
                    s2[url][selector] = s1[url][selector];
            }
        }
        else
            s2[url] = s1[url];
    }
    return s2;
}

function updateStylesInDataStore() {
    var jsonString = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = jsonString;
    
    /** Automatic Sync is disabled for now, until it is made more robust **/
    
    // is sync enabled? if yes, store in bookmark as well
    // if (cache.options.sync)
    //     saveSyncData(jsonString);
}

function loadStylesIntoCache() {
    if (localStorage['stylebot_styles']) {
        try {
            cache.styles = JSON.parse(localStorage['stylebot_styles']);
        }
        catch(e) {
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

function loadOptionsIntoCache() {
    if (!localStorage['stylebot_option_useShortcutKey'])
    {
        setDefaultOptionsInDataStore();
        return true;
    }
    cache.options.useShortcutKey = (localStorage['stylebot_option_useShortcutKey'] == 'true');
    cache.options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    cache.options.shortcutMetaKey = localStorage['stylebot_option_shortcutMetaKey'];
    cache.options.mode = localStorage['stylebot_option_mode'];
    cache.options.sync = (localStorage['stylebot_option_sync'] == 'true');
}

function setDefaultOptionsInDataStore() {
    // set defaults in localStorage
    localStorage['stylebot_option_useShortcutKey'] = cache.options.useShortcutKey;
    localStorage['stylebot_option_shortcutKey'] = cache.options.shortcutKey;
    localStorage['stylebot_option_shortcutMetaKey'] = cache.options.shortcutMetaKey;
    localStorage['stylebot_option_mode'] = cache.options.mode;
    localStorage['stylebot_option_sync'] = cache.options.sync;
}

function saveOption(name, value) {
    cache.options[name] = value;
    localStorage['stylebot_option_' + name] = value;
    propagateOptions();
}

/** end of data methods **/

function getRulesForPage(currUrl) {
    // this will contain the combined set of evaluated rules to be applied to the page.
    // longer, more specific URLs get the priority for each selector and property
    var rules = {};
    var url_for_page = '';
    for (var url in cache.styles)
    {
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
        if (isFound || url == "*")
        {
            if (url.length > url_for_page.length)
                url_for_page = url;
            
            // iterate over each selector in styles
            for (var selector in cache.styles[url]) {
                // if no rule exists for selector, simply copy the rule
                if (rules[selector] == undefined)
                    rules[selector] = cloneObject(cache.styles[url][selector]);
                // otherwise, iterate over each property
                else {
                    for (var property in cache.styles[url][selector])
                    {
                        if (rules[selector][property] == undefined || url == url_for_page)
                            rules[selector][property] = cache.styles[url][selector][property];
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

function propagateOptions() {
    sendRequestToAllTabs({ name: 'setOptions', options: cache.options }, function(){});
}

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

function saveAccordionState(enabledAccordions) {
    cache.enabledAccordions = enabledAccordions;
    localStorage['stylebot_enabledAccordions'] = enabledAccordions;
}

function loadAccordionState() {
    if (localStorage['stylebot_enabledAccordions'])
        cache.enabledAccordions = localStorage['stylebot_enabledAccordions'].split(',');
}

/*** Context Menu ***/

function initContextMenu() {
    chrome.contextMenus.create({
        title: "Style element",
        contexts: ['all'],
        onclick: openWidget
    });
}

function openWidget() {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, {name: "openWidget"}, function(){});
    });
}

/*** End of Context Menu ***/

window.addEventListener('load', function(){
    init();
});

/** Utility methods **/
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

// To copy an object. from: http://my.opera.com/GreyWyvern/blog/show.dml/1725165
function cloneObject(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = cloneObject(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
};