/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */
import CssUtils from '../css/CssUtils';

import {
  GetStylesForPageRequest,
  GetStylesForIframeRequest,
} from '../types/BackgroundPageRequest';

import { GetStylesForPageResponse } from '../types/BackgroundPageResponse';

const MAX_INJECT_COUNT = 10;
const INJECT_CSS_TIMEOUT = 300;

const injectCss = (
  request: GetStylesForPageRequest | GetStylesForIframeRequest,
  injectCount = 0
) => {
  chrome.extension.sendRequest(
    request,

    (response: GetStylesForPageResponse) => {
      if (response) {
        const { styles } = response;

        styles.forEach(style => {
          if (style.enabled) {
            CssUtils.injectCSSIntoDocument(style.css, style.url);
          }
        });
      } else if (injectCount < MAX_INJECT_COUNT) {
        setTimeout(() => {
          injectCss(request, injectCount + 1);
        }, INJECT_CSS_TIMEOUT);
      }
    }
  );
};

const run = () => {
  if (window === window.top) {
    injectCss({
      name: 'getStylesForPage',
      important: true,
    });
  } else {
    injectCss({
      name: 'getStylesForIframe',
      url: window.location.href,
      important: true,
    });
  }
};

run();
