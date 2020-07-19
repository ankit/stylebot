/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 */
import { injectCSSIntoDocument } from '@stylebot/css';
import { apply as applyReadability } from '@stylebot/readability';

import {
  GetStylesForPage,
  GetStylesForIframe,
  GetStylesForPageResponse,
} from '@stylebot/types';

const MAX_INJECT_COUNT = 10;
const INJECT_CSS_TIMEOUT = 300;

const injectCss = (
  message: GetStylesForPage | GetStylesForIframe,
  injectCount = 0
) => {
  chrome.runtime.sendMessage(
    message,

    (response: GetStylesForPageResponse) => {
      if (response) {
        const { styles, defaultStyle } = response;

        styles.forEach(style => {
          if (style.enabled) {
            injectCSSIntoDocument(style.css, style.url);
          }
        });

        if (defaultStyle && defaultStyle.readability) {
          applyReadability();
        }
      } else if (injectCount < MAX_INJECT_COUNT) {
        setTimeout(() => {
          injectCss(message, injectCount + 1);
        }, INJECT_CSS_TIMEOUT);
      }
    }
  );
};

const run = () => {
  if (window === window.top) {
    injectCss({
      name: 'GetStylesForPage',
      important: true,
    });
  } else {
    injectCss({
      name: 'GetStylesForIframe',
      url: window.location.href,
      important: true,
    });
  }
};

run();
