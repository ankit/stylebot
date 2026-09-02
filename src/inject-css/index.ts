/**
 * This content script injects any custom style for the page (if it exists)
 * as soon as the document starts loading.
 *
 * Styles are read directly from chrome.storage.local instead of via
 * chrome.runtime.sendMessage to the background service worker. The service
 * worker can be asleep when a page starts loading, and waking it up (plus
 * the round trip) is slow enough to cause a visible flash of unstyled
 * content. chrome.storage.local is handled by the browser itself and
 * doesn't require the service worker to be running.
 */
import { injectCSSIntoDocument } from '@stylebot/css';
import { apply as applyReadability } from '@stylebot/readability';
import { getStylesForPage } from '@stylebot/styles';
import { StyleMap } from '@stylebot/types';

const run = () => {
  chrome.storage.local.get('styles', items => {
    const allStyles: StyleMap = items['styles'] || {};
    const { styles, defaultStyle } = getStylesForPage(
      window.location.href,
      allStyles,
      true
    );

    styles.forEach(style => {
      if (style.enabled) {
        injectCSSIntoDocument(style.css, style.url);
      }
    });

    if (defaultStyle && defaultStyle.readability) {
      applyReadability();
    }
  });
};

run();
