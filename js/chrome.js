/**
  * stylebot.chrome
  * 
  * Methods making use of Chrome API
  **/

stylebot.chrome = {
    setIcon: function(value) {
        if(value)
            chrome.extension.sendRequest({ name: "enablePageIcon" }, function(){});
        else
            chrome.extension.sendRequest({ name: "disablePageIcon" }, function(){});
    },
    
    // send request to background.html to copy text
    copyToClipboard: function(text) {
        chrome.extension.sendRequest({ name: "copyToClipboard", text: text }, function(){});
    },
    
    // save rules for page
    save: function(domain, rules) {
        chrome.extension.sendRequest({ name: "save", rules: rules, domain: domain }, function(){});
    },
    
    load: function(domain, callback) {
        chrome.extension.sendRequest({ name: "getRulesForPage", domain: domain }, function(response){
            callback(response.rules);
        });
    }
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
        if(request.name == "toggle")
		{
		    stylebot.toggle();
		    sendResponse({ status:stylebot.status });
		}
});
