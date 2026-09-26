/**
 * Injects custom CSS for the page as soon as it starts loading. Applies the
 * localStorage cache (cache.ts) immediately if there is one, otherwise hides
 * the page (hide-page.ts) until chrome.storage.local.get resolves.
 */
import { isReaderable } from '@stylebot/readability';
import type { TabMessage } from '@stylebot/types';

import { readCache } from './cache';
import { hidePage, revealPage } from './hide-page';
import { applyPageState, getPageState, savePageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

// Registered synchronously here (unlike the editor script's listener,
// gated behind async init) so the popup always gets a response.
if (window === window.top) {
  chrome.runtime.onMessage.addListener(
    (
      message: TabMessage,
      _sender,
      sendResponse: (response: boolean) => void
    ) => {
      if (message.name === 'GetIsPageReaderable') {
        sendResponse(isReaderable());
      } else if (message.name === 'GetIsReadabilityActive') {
        sendResponse(!!document.getElementById('stylebot-reader'));
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
    applyPageState(cached);
  } else {
    hidePage();
  }

  const revealTimeout = setTimeout(revealPage, REVEAL_TIMEOUT_MS);

  getCompiledStyles().then(compiled => {
    const freshState = getPageState(compiled);
    const unchanged = JSON.stringify(cached) === JSON.stringify(freshState);

    if (!unchanged) {
      applyPageState(freshState, cached);
    }

    clearTimeout(revealTimeout);
    revealPage();
    savePageState(freshState);
  });
};

run();
