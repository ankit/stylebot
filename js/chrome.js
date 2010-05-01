/* Stylebot content code making use of Chrome API */

Stylebot.Chrome = {
    setIcon: function(value){
        if(value)
            chrome.extension.sendRequest({name:"enablePageIcon"}, function(){});
        else
            chrome.extension.sendRequest({name:"disablePageIcon"}, function(){});
    }
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
        if(request.name == "toggle")
		{
		    Stylebot.toggle();
		    sendResponse({status:Stylebot.status});
		}
});
