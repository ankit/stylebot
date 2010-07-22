/**
  * This content script injects any custom style for the page (if it exists) 
  * as soon as the document starts loading.
 **/

// temporaries used by stylebot.style.init()
var stylebotTempRules;
var stylebotTempUrl;

// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({ name: "getRulesForPage", url: window.location.href }, function(response) {
    // update temp vars for stylebot.style
    stylebotTempRules = response.rules;
    stylebotTempUrl = response.url;

    if (!response.rules)
        return;
    
    var css = CSSUtils.crunchCSS(response.rules, true);
    CSSUtils.injectCSS(css, "stylebot-css");
});