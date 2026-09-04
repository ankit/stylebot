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
 *
 * Reading storage is still asynchronous, so the page keeps parsing and can
 * paint before the style is injected. cache.ts caches the last-applied
 * result in localStorage, which is readable synchronously, and reapplies it
 * before anything else runs — closing the gap entirely on repeat visits.
 * The only case that still needs hide-page.ts's hide-until-ready fallback
 * is a page with no cache yet (first visit, or right after editing the
 * style that applies to it).
 *
 * chrome.storage.local.get is still consulted on every load, cache hit or
 * not, to catch styles that changed since the cache was written; if the
 * result differs, the applied CSS is patched in place and the cache updated.
 */
import { getStylesForPage } from '@stylebot/styles';
import { StyleMap } from '@stylebot/types';

import { applyState } from './apply-state';
import { CachedState, readCache, writeCache } from './cache';
import { hidePage, revealPage } from './hide-page';

// Fallback in case storage read (or, for an `@import` style, the background
// service worker round trip in getCssWithExpandedImports) stalls or fails —
// real completion almost always wins the race and reveals sooner than this.
const REVEAL_TIMEOUT_MS = 150;

const run = () => {
  const cached = readCache();

  if (cached) {
    applyState(cached);
  } else {
    hidePage();
  }

  const revealTimeout = setTimeout(revealPage, REVEAL_TIMEOUT_MS);

  chrome.storage.local.get('styles', items => {
    const allStyles: StyleMap = items['styles'] || {};
    const { styles, defaultStyle } = getStylesForPage(
      window.location.href,
      allStyles,
      true
    );

    const freshState: CachedState = {
      styles: styles.map(({ url, css, enabled }) => ({ url, css, enabled })),
      readability: Boolean(defaultStyle && defaultStyle.readability),
    };

    const finish = () => {
      writeCache(freshState);
      clearTimeout(revealTimeout);
      revealPage();
    };

    if (cached && JSON.stringify(cached) === JSON.stringify(freshState)) {
      finish();
      return;
    }

    applyState(freshState).then(finish);
  });
};

run();
