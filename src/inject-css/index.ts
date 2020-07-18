/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */
import { injectCSSIntoDocument } from '@stylebot/css';

import {
  GetStylesForPageRequest,
  GetStylesForIframeRequest,
  GetStylesForPageResponse,
} from '@stylebot/types';

import { apply as applyReadability } from '../readability/index';
import { apply as applyDarkMode } from '../dark-mode/index';

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
            injectCSSIntoDocument(style.css, style.url);
          }

          if (style.readability) {
            applyReadability();
          } else if (style.darkMode) {
            applyDarkMode();
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
