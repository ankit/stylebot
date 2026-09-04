import * as postcss from 'postcss';

import { GetImportCss, GetImportCssResponse } from '@stylebot/types';

// Strips @import rules out so the rest of the CSS can be applied without
// waiting on a network fetch for them.
export const extractImports = (
  css: string
): { css: string; importUrls: Array<string> } => {
  const root = postcss.parse(css);
  const importUrls: Array<string> = [];

  root.walkAtRules('import', (atRule: postcss.AtRule) => {
    const regex = /^(url\()?([^\)]*)(\))?$/;
    const paramsWithoutQuotes = atRule.params
      .replace(/"/g, '')
      .replace(/\'/g, '');
    const matches = paramsWithoutQuotes.match(regex);

    if (matches) {
      importUrls.push(matches[2]);
      atRule.remove();
    }
  });

  return { css: root.toString(), importUrls };
};

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

// Removes cached @import responses for urls no longer referenced by any
// current style, so editing or removing an @import doesn't leak its cache
// entry on this origin forever.
export const pruneImportCache = (liveUrls: ReadonlySet<string>): void => {
  try {
    const staleKeys: Array<string> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key &&
        key.startsWith(IMPORT_CACHE_PREFIX) &&
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

// Fetches one @import's CSS via the background service worker, to get
// around CORS.
const fetchAndCacheImportCss = (url: string): Promise<string> =>
  new Promise(resolve => {
    const message: GetImportCss = { name: 'GetImportCss', url };

    chrome.runtime.sendMessage(message, (response: GetImportCssResponse) => {
      if (response) {
        writeImportCache(url, response);
      }

      resolve(response);
    });
  });

// Imported CSS (e.g. a Google Font) rarely changes and fetching it always
// goes through the background service worker, which can be slow to wake
// from cold. A cached response resolves immediately; it's still refreshed
// in the background so a real change eventually reaches the next load.
export const fetchImportCss = (url: string): Promise<string> => {
  const cached = readImportCache(url);

  if (cached === null) {
    return fetchAndCacheImportCss(url);
  }

  fetchAndCacheImportCss(url);
  return Promise.resolve(cached);
};

export const getCssWithExpandedImports = async (
  css: string
): Promise<string> => {
  const { css: withoutImports, importUrls } = extractImports(css);
  const values = await Promise.all(importUrls.map(fetchImportCss));
  const merged = values.join('\n\n');

  return merged ? `${merged}\n\n${withoutImports}` : withoutImports;
};
