import type { GetImportCss, GetImportCssResponse } from '@stylebot/types';

const IMPORT_CACHE_PREFIX = 'stylebot-import-cache:';
const importCacheKey = (url: string) => `${IMPORT_CACHE_PREFIX}${url}`;

const readImportCache = (url: string): string | null => {
  try {
    return localStorage.getItem(importCacheKey(url));
  } catch {
    return null;
  }
};

const writeImportCache = (url: string, css: string): void => {
  try {
    localStorage.setItem(importCacheKey(url), css);
  } catch {
    // localStorage may be unavailable (e.g. blocked by the page); the next
    // load will simply fetch again instead of hitting the cache.
  }
};

/**
 * Removes cached @import responses for urls no current style references, so
 * editing or removing an @import doesn't leak its entry on this origin.
 */
export const pruneImportCache = (liveUrls: ReadonlySet<string>): void => {
  try {
    const staleKeys: Array<string> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key?.startsWith(IMPORT_CACHE_PREFIX) &&
        !liveUrls.has(key.slice(IMPORT_CACHE_PREFIX.length))
      ) {
        staleKeys.push(key);
      }
    }

    staleKeys.forEach(key => localStorage.removeItem(key));
  } catch {
    // localStorage may be unavailable; nothing to clean up then.
  }
};

/**
 * Fetches one @import's CSS via the background service worker, to get around CORS.
 */
const fetchAndCacheImportCss = async (url: string): Promise<string> => {
  const message: GetImportCss = { name: 'GetImportCss', url };

  const response = await chrome.runtime
    .sendMessage<GetImportCss, GetImportCssResponse>(message)
    .catch(() => '');

  if (response) {
    writeImportCache(url, response);
  }

  return response;
};

/**
 * Resolves from the cache at once, since waking the background can be slow,
 * and refreshes it behind the scenes so a real change reaches the next load.
 */
export const fetchImportCss = (url: string): Promise<string> => {
  const cached = readImportCache(url);

  if (cached === null) {
    return fetchAndCacheImportCss(url);
  }

  fetchAndCacheImportCss(url);
  return Promise.resolve(cached);
};
