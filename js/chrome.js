/**
  * stylebot.chrome
  * 
  * Methods making use of Chrome API
  **/

stylebot.chrome = {
    setIcon: function(value){
        if(value)
            chrome.extension.sendRequest({ name: "enablePageIcon" }, function(){});
        else
            chrome.extension.sendRequest({ name: "disablePageIcon" }, function(){});
    },
    
    // send request to background.html to copy text
    copyToClipboard: function(text){
        chrome.extension.sendRequest({ name: "copyToClipboard", text: text }, function(){});
    }
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
        if(request.name == "toggle")
		{
		    stylebot.toggle();
		    sendResponse({ status:stylebot.status });
		}
});
