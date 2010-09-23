/**
  * This content script injects any custom style for the page (if it exists) 
  * as soon as the document starts loading.
 **/

// temporaries used by stylebot.style.initialize()
var stylebotTempUrl;
var stylebotTempRules;

// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({ name: "getRulesForPage", url: window.location.href }, function(response) {
    stylebotTempUrl = response.url;
    stylebotTempRules = response.rules;
    
    var css = CSSUtils.crunchCSS(response.rules, true);
    if (css != "") {
        CSSUtils.injectCSS(css, "stylebot-css");
    }
});