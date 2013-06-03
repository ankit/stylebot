/**
  * This content script injects any custom style for the page (if it exists)
  * as soon as the document starts loading.
 **/

// Temporary variables used by stylebot.style.initialize()
var stylebotTempUrl;
var stylebotTempRules;
var stylebotTempGlobalRules;

// send request to background.html to get stylebot rules for page
var request;
if (window === window.top) {
  request = 'getCombinedRulesForPage';
} else {
  request = 'getCombinedRulesForIframe';
}

chrome.extension.sendRequest({name: request, url: window.location.href}, function(response) {
  // global css
  if (response.global) {
    stylebotTempGlobalRules = response.global;
    CSSUtils.crunchCSS(response.global, true, true, function(css) {
      if (css != '') {
        CSSUtils.injectCSS(css, 'stylebot-global-css');
      }
    });
  }

  stylebotTempUrl = response.url;
  stylebotTempRules = response.rules;

  if (stylebotTempUrl && stylebotTempRules) {
    CSSUtils.crunchCSS(response.rules, true, true, function(css) {
      if (css != '') {
        CSSUtils.injectCSS(css, 'stylebot-css');
      }
    });
  }
});
