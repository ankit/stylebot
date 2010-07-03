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
    save: function(url, rules) {
        chrome.extension.sendRequest({ name: "save", rules: rules, url: url }, function(){});
    },
    
    // send request to fetch options from datastore
    fetchOptions: function() {
        chrome.extension.sendRequest({ name: "fetchOptions" }, function( response ){
            stylebot.setOptions(response.options);
        });
    }
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
        if( request.name == "toggle" )
		{
		    if(window != window.top)
		        return;
            stylebot.toggle();
		    sendResponse( { status: stylebot.status } );
		}
		else if( request.name == "setOptions" )
		{
		    stylebot.setOptions( request.options );
            sendResponse({});
		}
});
