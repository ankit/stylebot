/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */
import CssUtils from '../css/CssUtils';

import {
  GetMergedCssAndUrlForPageRequest,
  GetMergedCssAndUrlForIframeRequest,
} from '../types/BackgroundPageRequest';

import {
  GetMergedCssAndUrlForPageResponse,
  GetMergedCssAndUrlForIframeResponse,
} from '../types/BackgroundPageResponse';

const MAX_INJECT_COUNT = 10;
const INJECT_CSS_TIMEOUT = 300;

const injectCss = (
  request:
    | GetMergedCssAndUrlForPageRequest
    | GetMergedCssAndUrlForIframeRequest,
  injectCount: number = 0
) => {
  chrome.extension.sendRequest(
    request,

    (
      response:
        | GetMergedCssAndUrlForPageResponse
        | GetMergedCssAndUrlForIframeResponse
    ) => {
      if (response) {
        CssUtils.injectCSSIntoDocument(response.css);
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
      name: 'getMergedCssAndUrlForPage',
      important: true,
    });
  } else {
    injectCss({
      name: 'getMergedCssAndUrlForIframe',
      url: window.location.href,
      important: true,
    });
  }
};

run();
