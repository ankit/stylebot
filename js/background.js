/* Background JS for Stylebot */

var currTabId;

function init(){
    addListeners();
}

function addListeners(){
    chrome.pageAction.onClicked.addListener(handlePageIconClick);
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
        chrome.pageAction.show(tabId);
    });
    
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
        switch(request.name){
            case "enablePageIcon": enablePageIcon(sender.tab.id); break;
            case "disablePageIcon": disablePageIcon(sender.tab.id); break;
        }
    });
}

/**
 * Page Action handling
 **/

// Toggle CSS editing when page icon is clicked
function handlePageIconClick(tab){
    currTabId = tab.id;
    chrome.tabs.sendRequest(currTabId, {name:"toggle"}, function(response){
        if(response.status)
            enablePageIcon(currTabId);
        else
            disablePageIcon(currTabId);
    });
}

function enablePageIcon(tabId){
    chrome.pageAction.setIcon({tabId:tabId, path:"images/icon19_on.png"});
    chrome.pageAction.setTitle({tabId:tabId, title:"Click to turn CSS editing off"});
}

function disablePageIcon(tabId){
    chrome.pageAction.setIcon({tabId:tabId, path:"images/icon19_off.png"});
    chrome.pageAction.setTitle({tabId:tabId, title:"Click to turn CSS editing on"});
}

window.addEventListener('load', function(){
    init();
});