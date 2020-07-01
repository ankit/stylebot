/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */

import CssUtils from '../css/CssUtils';

const MAX_INJECT_COUNT = 10;
const INJECT_CSS_TIMEOUT = 300;

const injectCss = (
  request: { name: string; url?: string },
  injectCount: number
) => {
  chrome.extension.sendRequest(
    request,

    response => {
      if (response && response.success) {
        if (response.url) {
          CssUtils.getCSS(response.rules, true, true, (css: string) => {
            if (css !== '') {
              CssUtils.injectCSSIntoDocument(css, 'stylebot-css');
            }
          });
        }
      } else {
        if (injectCount < MAX_INJECT_COUNT) {
          setTimeout(() => {
            injectCss(request, injectCount + 1);
          }, INJECT_CSS_TIMEOUT);
        }
      }
    }
  );
};

const run = () => {
  if (window === window.top) {
    injectCss({ name: 'getComputedStylesForTab' }, 0);
  } else {
    injectCss(
      {
        name: 'getComputedStylesForIframe',
        url: window.location.href,
      },
      0
    );
  }
};

run();
