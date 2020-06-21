/* eslint-disable no-undef */
/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */

const APPLY_CSS_TIMEOUT = 300;
const MAX_APPLY_CSS_COUNT = 10;

// Temporary variables used by stylebot.style.initialize()
var stylebotTempUrl;
var stylebotTempRules;

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
        stylebotTempUrl = response.url;
        stylebotTempRules = response.rules;

        if (stylebotTempUrl) {
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
