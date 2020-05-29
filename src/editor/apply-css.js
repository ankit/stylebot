/* eslint-disable no-undef */
/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */
// globals
var APPLY_CSS_TIMEOUT = 300;
var MAX_APPLY_CSS_COUNT = 10;

// Temporary variables used by stylebot.style.initialize()
var stylebotTempUrl;
var stylebotTempRules;
var stylebotTempGlobalRules;
var stylebotTempSocialData;

// send request to background.html to get stylebot rules for page
let request;
if (window === window.top) {
  request = { name: 'getComputedStylesForTab' };
} else {
  request = { name: 'getComputedStylesForIframe', url: window.location.href };
}

var applyCSSCount = 0;
function applyCSS() {
  chrome.extension.sendRequest(
    request,

    function(response) {
      if (response && response.success) {
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
        stylebotTempSocialData = response.social;

        if (stylebotTempUrl && stylebotTempRules) {
          CSSUtils.crunchCSS(response.rules, true, true, function(css) {
            if (css != '') {
              CSSUtils.injectCSS(css, 'stylebot-css');
            }
          });
        }
      } else {
        if (applyCSSCount < MAX_APPLY_CSS_COUNT) {
          applyCSSCount++;
          setTimeout(applyCSS, APPLY_CSS_TIMEOUT);
        }
      }
    }
  );
}

applyCSS();
