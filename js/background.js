/* Background JS for Stylebot */

var currTabId;

var cache = {
    /*
        e.g. styles = {
            'google.com' : rules
        }
    */
    styles: {}
};

function init(){
    addListeners();
    loadStylesIntoCache();
}

function addListeners(){
    chrome.pageAction.onClicked.addListener(handlePageIconClick);
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        chrome.pageAction.show(tabId);
    });
    
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        switch(request.name){
            case "enablePageIcon"   : enablePageIcon(sender.tab.id); break;
            case "disablePageIcon"  : disablePageIcon(sender.tab.id); break;
            case "copyToClipboard"  : copyToClipboard(request.text); break;
            case "save"             : save(request.url, request.rules); break;
            case "getRulesForPage"  : sendResponse(getRulesForPage(request.url)); break;
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
    cache.styles = JSON.parse( localStorage['stylebot_styles'] );
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

window.addEventListener('load', function(){
    init();
});