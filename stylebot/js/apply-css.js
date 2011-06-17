/**
  * This content script injects any custom style for the page (if it exists)
  * as soon as the document starts loading.
 **/

// Temporary variables used by stylebot.style.initialize()
var stylebotTempUrl;
var stylebotTempRules;
var stylebotTempGlobalRules;

// send request to background.html to get stylebot rules for page
chrome.extension.sendRequest({name: 'getCombinedRulesForPage', url: window.location.href}, function(response) {
    // global css rules
    if (response.global) {
        stylebotTempGlobalRules = response.global;
        var css = CSSUtils.crunchCSS(response.global, true);
        if (css != '') {
            CSSUtils.injectCSS(css, 'stylebot-global-css');
        }
    }

    stylebotTempUrl = response.url;
    stylebotTempRules = response.rules;

    if (stylebotTempUrl && stylebotTempRules) {
        var css = CSSUtils.crunchCSS(response.rules, true);
        if (css != '') {
            CSSUtils.injectCSS(css, 'stylebot-css');
        }
    }
});
