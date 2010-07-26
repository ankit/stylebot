/* Background JS for Stylebot */

var currTabId;

// to prevent sync() from getting called when saveBookmark changes bookmark url
// used in sync
var saveBookmarkWasCalled = false;

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
    
    bookmarkId: null,
    
    options: {
        useShortcutKey: true,
        shortcutKey: 69, // keydown code for 'e'
        shortcutMetaKey: 'ctrl',
        mode: 'Basic',
        sync: false
    },
    
    // indices of enabled accordions
    enabledAccordions: [0]
};

function init(){
    addListeners();
    loadOptionsIntoCache();
    loadStylesIntoCache();
    loadAccordionState();
    if (cache.options.sync)
        sync();
}

function addListeners(){
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
            
            case "getRulesForPage"  : sendResponse(getRulesForPage(request.url)); sendResponse({}); break;
            
            case "fetchOptions"     : sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case "saveAccordionState": saveAccordionState(request.enabledAccordions); sendResponse({}); break;
        }
    });
}

/**
 * Page Action handling
 **/

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
    chrome.pageAction.setTitle({ tabId: tabId, title: "Click to turn CSS editing off" });
}

function disablePageIcon(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: "images/icon19_off.png" });
    chrome.pageAction.setTitle({ tabId: tabId, title: "Click to turn CSS editing on" });
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

// save rules
function save(url, rules) {
    if (rules)
        cache.styles[url] = rules;
    else
        delete cache.styles[url];
    var json = JSON.stringify(cache.styles);
    
    localStorage['stylebot_styles'] = json;
    
    // is sync enabled? if yes, store in bookmark as well
    if (cache.options.sync) {
        saveStylebotBookmark(json);
    }
}

function saveStyles(styles) {
    if (styles)
        cache.styles = styles;
    var json = JSON.stringify(cache.styles);
    localStorage['stylebot_styles'] = json;

    // is sync enabled? if yes, store in bookmark as well
    if (cache.options.sync) {
        saveStylebotBookmark(json);
    }
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

function initDataStore() {
    // set defaults in datastore
    localStorage['stylebot_option_useShortcutKey'] = cache.options.useShortcutKey;
    localStorage['stylebot_option_shortcutKey'] = cache.options.shortcutKey;
    localStorage['stylebot_option_shortcutMetaKey'] = cache.options.shortcutMetaKey;
    localStorage['stylebot_option_mode'] = cache.options.mode;
    localStorage['stylebot_option_sync'] = cache.options.sync;
}

function loadOptionsIntoCache() {
    if (!localStorage['stylebot_option_useShortcutKey'])
    {
        initDataStore();
        return true;
    }
    cache.options.useShortcutKey = (localStorage['stylebot_option_useShortcutKey'] == 'true');
    cache.options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    cache.options.shortcutMetaKey = localStorage['stylebot_option_shortcutMetaKey'];
    cache.options.mode = localStorage['stylebot_option_mode'];
    cache.options.sync = (localStorage['stylebot_option_sync'] == 'true');
}

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
                    rules[selector] = cache.styles[url][selector];
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

function saveOption(name, value) {
    cache.options[name] = value;
    localStorage['stylebot_option_' + name] = value;
    propagateOptions();
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

function loadStylebotBookmark(callback) {
    var parse = function(url) {
        if (url && url != "")
            callback(unescape(url.replace("http://stylebot/?data=", "")));
        else
            callback(null);
    }

    loadBookmark(null, "stylebot_styles_data", function(bookmarks) {
        if (bookmarks.length != 0) {
            var bookmark = bookmarks[0];
            // handle duplicates
            if (bookmarks.length > 0) {
                // retain only the latest bookmark. get rid of all others
                // TODO: call mergeStyles for earlier bookmarks
                var len = bookmarks.length;
                for (var i = 1; i < len; i++) {
                    if (bookmarks[i].dateAdded < bookmark.dateAdded) {
                        removeBookmarkTree(bookmark.parentId);
                        bookmark = bookmarks[i];
                    }
                    else
                        removeBookmarkTree(bookmarks[i].parentId);
                }
            }
            cache.bookmarkId = bookmark.id;
            parse(bookmark.url);
        }
        else
            parse(null);
    });
}

function saveStylebotBookmark(data) {
    data = "http://stylebot/?data=" + escape(data);
    if (!cache.bookmarkId) {
        var create = function(id) {
            createBookmark("stylebot_styles_data", data, id, function(bookmark) {
                cache.bookmarkId = bookmark.id;
            });
        }
        // create folder
        createBookmark("StylebotSync", null, null, function(folder) {
            create(folder.id);
        });
    }
    else {
        saveBookmarkWasCalled = true;
        saveBookmark(cache.bookmarkId, data, function(bookmark){
            saveBookmarkWasCalled = false;
            // some develish power deleted the bookmark. reset cache.bookmarkId and create it again
            if (!bookmark) {
                cache.bookmarkId = null;
                saveStylebotBookmark(JSON.stringify(cache.styles));
            }
        });
    }
}

window.addEventListener('load', function(){
    init();
});

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};