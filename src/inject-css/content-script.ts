/**
 * Injects custom CSS for the page as soon as it starts loading. Applies the
 * localStorage cache (cache.ts) immediately if there is one, otherwise hides
 * the page (hide-page.ts) until chrome.storage.local.get resolves.
 */
import { isReaderable } from '@stylebot/readability';
import {
  COMPILED_STYLES_KEY,
  STYLES_METADATA_KEY,
  getStylesForPage,
  isCompiledStylesCurrent,
} from '@stylebot/styles';
import type {
  CompiledStyles,
  GetCompiledStyles,
  GetCompiledStylesResponse,
  TabMessage,
} from '@stylebot/types';

import { applyState } from './apply-state';
import type { CachedState } from './cache';
import { readCache, writeCache } from './cache';
import { hidePage, revealPage } from './hide-page';
import { pruneImportCache } from './import-cache';

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

/**
 * The compiled styles from storage, or from the background when the stored
 * copy is missing or was built from other styles, as on the first load after
 * an update.
 */
const getCompiledStyles = async (): Promise<CompiledStyles> => {
  const items = await chrome.storage.local.get([
    COMPILED_STYLES_KEY,
    STYLES_METADATA_KEY,
  ]);
  const stored: CompiledStyles | undefined = items[COMPILED_STYLES_KEY];
  const revision: string = items[STYLES_METADATA_KEY]?.modifiedTime ?? '';

  if (stored && isCompiledStylesCurrent(stored, revision)) {
    return stored;
  }

  const message: GetCompiledStyles = { name: 'GetCompiledStyles' };
  return chrome.runtime.sendMessage<
    GetCompiledStyles,
    GetCompiledStylesResponse
  >(message);
};

const run = () => {
  const cached = readCache();

  if (cached) {
    applyState(cached);
  } else {
    hidePage();
  }

  const revealTimeout = setTimeout(revealPage, REVEAL_TIMEOUT_MS);

  getCompiledStyles().then(compiled => {
    const { styles, defaultStyle } = getStylesForPage(
      window.location.href,
      compiled.styles
    );

    const freshState: CachedState = {
      styles: styles.map(({ url, css, importUrls, enabled }) => ({
        url,
        css,
        importUrls,
        enabled,
      })),
      readability: Boolean(defaultStyle?.readability),
    };

    if (!cached || JSON.stringify(cached) !== JSON.stringify(freshState)) {
      applyState(freshState);
    }

    clearTimeout(revealTimeout);
    revealPage();
    writeCache(freshState);
    pruneImportCache(
      new Set(freshState.styles.flatMap(style => style.importUrls))
    );
  });
};

run();
