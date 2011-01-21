/**
  * stylebot.chrome
  * 
  * Methods sending / receving messages from background.html
  **/

stylebot.chrome = {
    setIcon: function(value) {
        if (value)
            chrome.extension.sendRequest({ name: "enablePageIcon" }, function(){});
        else
            chrome.extension.sendRequest({ name: "disablePageIcon" }, function(){});
    },
    
    // send request to background.html to copy text
    copyToClipboard: function(text) {
        chrome.extension.sendRequest({ name: "copyToClipboard", text: text }, function(){});
    },
    
    // save all rules for a page
    save: function(url, rules) {
        chrome.extension.sendRequest({ name: "save", rules: rules, url: url }, function(){});
    },

	install: function(url, rules, id) {
		chrome.extension.sendRequest({ name: "install", rules: rules, url: url, id: id}, function() {});
	},
    
    // transfer all rules for src url to dest url
    transfer: function(src, dest) {
        chrome.extension.sendRequest({name: "transfer", source: src, destination: dest}, function(){});
    },
    
    // send request to fetch options from datastore
    fetchOptions: function() {
        chrome.extension.sendRequest({ name: "fetchOptions" }, function(response){
            initialize(response);
        });
    },
    
    saveAccordionState: function(enabledAccordions) {
        chrome.extension.sendRequest({ name: "saveAccordionState", enabledAccordions: enabledAccordions }, function(){} );
    },

	pushStyles: function() {
		chrome.extension.sendRequest({ name: "pushStyles" }, function(){} );
	}
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
        if (request.name === "toggle")
		{
		    if (window != window.top)
		        return;
            stylebot.toggle();
		    sendResponse({status: stylebot.status});
		}
		else if (request.name === "setOptions")
		{
		    stylebot.setOptions(request.options);
            sendResponse({});
		}
		else if (request.name === "openWidget")
		{
            stylebot.contextmenu.openWidget();
		    sendResponse({});
		}
		else if (request.name === "searchSocial") {
			if (!window.top)
				return;
			stylebot.contextmenu.searchSocial();
		}
		else if (request.name === "shareStyleOnSocial") {
			if (!window.top)
				return;
			stylebot.contextmenu.shareStyleOnSocial();
		}
	}
);