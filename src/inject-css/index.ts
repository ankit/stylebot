/**
 * Injects custom CSS for the page as soon as it starts loading. Applies the
 * localStorage cache (cache.ts) immediately if there is one, otherwise hides
 * the page (hide-page.ts) until chrome.storage.local.get resolves.
 */
import { extractImports, pruneImportCache } from '@stylebot/css';
import { isReaderable } from '@stylebot/readability';
import { getStylesForPage } from '@stylebot/styles';
import { StyleMap, TabMessage } from '@stylebot/types';

import { applyState } from './apply-state';
import { CachedState, readCache, writeCache } from './cache';
import { hidePage, revealPage } from './hide-page';

// Registered synchronously here (unlike the editor script's listener,
// gated behind async init) so the popup always gets a response.
if (window === window.top) {
  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _sender, sendResponse: (response: boolean) => void) => {
      if (message.name === 'GetIsPageReaderable') {
        sendResponse(isReaderable());
      }
    }
  );
}

// Fallback if the storage read (or an @import fetch) stalls — real
// completion almost always wins the race and reveals sooner.
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

      const liveImportUrls = new Set(
        freshState.styles.flatMap(
          style => extractImports(style.css).importUrls
        )
      );
      pruneImportCache(liveImportUrls);

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
