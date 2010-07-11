/* Background JS for Stylebot */

var currTabId;

var cache = {
    /*
        e.g. styles = {
            'google.com' : rules
        }
    */
    styles: {},
    
    options: {
        useShortcutKey: true,
        shortcutKey: 69, // keydown code for 'e'
        shortcutMetaKey: 'ctrl',
        mode: 'Basic'
    },
    
    // indices of enabled accordions
    enabledAccordions: 0
};

function init(){
    addListeners();
    loadStylesIntoCache();
    loadOptionsIntoCache();
    loadAccordionState();
}

function addListeners(){
    chrome.pageAction.onClicked.addListener(handlePageIconClick);
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if(tab.url.match("^http") == "http" && tab.url.indexOf("https://chrome.google.com/extensions") == -1)
            chrome.pageAction.show(tabId);
    });
    
    chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
        switch( request.name ) {
            case "enablePageIcon"   : enablePageIcon( sender.tab.id ); sendResponse({}); break;
            
            case "disablePageIcon"  : disablePageIcon( sender.tab.id ); sendResponse({}); break;
            
            case "copyToClipboard"  : copyToClipboard( request.text ); sendResponse({}); break;
            
            case "save"             : save( request.url, request.rules ); sendResponse({}); break;
            
            case "getRulesForPage"  : sendResponse( getRulesForPage( request.url ) ); sendResponse({}); break;
            
            case "fetchOptions"     : sendResponse( { options: cache.options, enabledAccordions: cache.enabledAccordions } ); break;
            
            case "saveAccordionState": saveAccordionState( request.enabledAccordions ); sendResponse({}); break;
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
    cache.styles[url] = rules;

    // for now, simply store them in localStorage. In future, they'll stored in a bookmark / db
    localStorage['stylebot_styles'] = JSON.stringify(cache.styles);
}

function loadStylesIntoCache() {
    if( localStorage['stylebot_styles'] )
        cache.styles = JSON.parse( localStorage['stylebot_styles'] );
}


function initDataStore() {
    // set defaults in datastore
    localStorage['stylebot_option_useShortcutKey'] = cache.options.useShortcutKey;
    localStorage['stylebot_option_shortcutKey'] = cache.options.shortcutKey;
    localStorage['stylebot_option_shortcutMetaKey'] = cache.options.shortcutMetaKey;
    localStorage['stylebot_option_mode'] = cache.options.mode;
}

function loadOptionsIntoCache() {
    if( !localStorage['stylebot_option_useShortcutKey'] )
    {
        initDataStore();
        return true;
    }
    cache.options.useShortcutKey = ( localStorage['stylebot_option_useShortcutKey'] == 'true' );
    cache.options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    cache.options.shortcutMetaKey = localStorage['stylebot_option_shortcutMetaKey'];
    cache.options.mode = localStorage['stylebot_option_mode'];
}

function getRulesForPage(currUrl) {
    var rules = {};
    var url_for_page = '';
    for(var url in cache.styles)
    {
        if(currUrl.indexOf(url) != -1)
        {
            for(var property in cache.styles[url])
                rules[property] = cache.styles[url][property];
            if(url.length > url_for_page.length)
                url_for_page = url;
        }
    }
    if(rules != undefined)
        return { rules: rules, url: url_for_page };
    else
        return { rules: null, url: null };
}

function propagateOptions() {
    sendRequestToAllTabs( { name: 'setOptions', options: cache.options }, function(){} );
}

function sendRequestToAllTabs(req){
    chrome.windows.getAll( { populate: true }, function(windows) {
	    var w_len = windows.length;
		for( i = 0; i < w_len; i++)
		{
            var t_len = windows[i].tabs.length;
			for(j = 0; j < t_len; j++)
			{
				chrome.tabs.sendRequest( windows[i].tabs[j].id, req, function(response){} );
			}
		}
	});
}

function saveAccordionState( enabledAccordions ) {
    cache.enabledAccordions = enabledAccordions;
    localStorage[ 'stylebot_enabledAccordions' ] = enabledAccordions;
}

function loadAccordionState() {
    if( localStorage[ 'stylebot_enabledAccordions' ] )
        cache.enabledAccordions = localStorage[ 'stylebot_enabledAccordions' ].split(',');
}

window.addEventListener('load', function(){
    init();
});