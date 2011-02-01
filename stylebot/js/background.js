/* Background JS for Stylebot */

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
		contextMenu: true
    },
    
    // indices of enabled accordions. by default, all are enabled
    enabledAccordions: [0, 1, 2, 3]
};

function init() {
    attachListeners();
    loadOptionsIntoCache();
    loadStylesIntoCache();
    updateVersion();
    loadAccordionState();
    if (cache.options.sync) {
        loadSyncId();
        attachSyncListeners();
    }
	createContextMenu();
}

function openReleaseNotes() {
    chrome.tabs.create({ url: "http://stylebot.me/releases", selected: true }, null);
}

function updateVersion() {
    if (!localStorage.version) {
        localStorage.version = "1"; return true;
    }

    else if (localStorage.version != "1") {
		openReleaseNotes();
		upgradeTo1();
	}
}

function upgradeTo1() {
	console.log("Upgrading to version 1...");
    localStorage.version = "1";

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
		cache.styles[url]['_rules'] = rules;
	}
	
	// save to localStorage
	updateStylesInDataStore();
	
	// update data in bookmark as well
	pushStyles();
}

// Listen to requests tabs and page action
function attachListeners() {
    chrome.pageAction.onClicked.addListener(handlePageIconClick);
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (tab.url.match("^http") == "http" && tab.url.indexOf("https://chrome.google.com/extensions") == -1)
            chrome.pageAction.show(tabId);
    });
    
    chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
        switch (request.name) {
            case "enablePageIcon"   	: enablePageIcon(sender.tab.id); sendResponse({}); break;
            
            case "disablePageIcon" 	 	: disablePageIcon(sender.tab.id); sendResponse({}); break;
            
            case "copyToClipboard"  	: copyToClipboard(request.text); sendResponse({}); break;
            
            case "save"             	: save(request.url, request.rules, request.data); sendResponse({}); break;

            case "doesStyleExist"   	: sendResponse(doesStyleExist(request.url)); break;

            case "transfer"         	: transfer(request.source, request.destination); sendResponse({}); break;
            
            case "getRulesForPage"  	: sendResponse(getRulesForPage(request.url)); break;
            
            case "fetchOptions"     	: sendResponse({ options: cache.options, enabledAccordions: cache.enabledAccordions }); break;

            case "saveAccordionState"	: saveAccordionState(request.enabledAccordions); sendResponse({}); break;

            case "pushStyles"			: pushStyles(); sendResponse({}); break;
        }
    });
}


// Toggle CSS editing when page icon is clicked
function handlePageIconClick(tab) {
    currTabId = tab.id;
    chrome.tabs.sendRequest(currTabId, { name: "toggle" }, function(response) {
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

// Returns if a style already exists for the site
// used to issue warning to user while installing styles from social
function doesStyleExist(url) {
	if (cache.styles[url]) {
		return true;
	}
	else
		return false;
}

// Save all rules for a page
function save(url, rules, data) {
    if (!url || url == "")
        return;

    if (rules) {
		cache.styles[url] = {};
 		cache.styles[url]['_rules'] = rules;		
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
    if (cache.styles[source]) {
        cache.styles[destination] = cache.styles[source];
        updateStylesInDataStore();

		// the user has to delete the styles for the previous url manually
        // if (destination.indexOf(source) == -1)
        //     delete cache.styles[source];
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

// Return CSS rules for a URL
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
			onclick: function() { sendRequestToCurrentTab("openWidget"); },
			parentId: contextMenuId
		});
		
		contextMenuStatusId = chrome.contextMenus.create({
			title: "Toggle styling",
			contexts: ['all'],
			onclick: function() { sendRequestToCurrentTab("toggleStyle"); },
			parentId: contextMenuId
		});
		
		chrome.contextMenus.create({
			title: "Search for styles...",
			contexts: ['all'],
			onclick: function() { sendRequestToCurrentTab("searchSocial"); },
			parentId: contextMenuId
		});
	}
}

// Send a request to the current selected tab
function sendRequestToCurrentTab(msg) {
	chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, { name: msg }, function() {});
    });	
}

// Remove context menu
function removeContextMenu() {
	if (contextMenuId) {
		chrome.contextMenus.remove(contextMenuId);
		contextMenuId = null;
	}
}

window.addEventListener('load', function(){
    init();
});

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
    } else newObj[i] = obj[i]
  } return newObj;
};