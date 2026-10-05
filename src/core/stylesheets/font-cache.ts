const FONT_CACHE_PREFIX = 'stylebot-font-cache:';
const fontCacheKey = (url: string) => `${FONT_CACHE_PREFIX}${url}`;

const GOOGLE_FONT_FILE_URLS = /https:\/\/fonts\.gstatic\.com\/[^"')\s]+/g;

/**
 * The Google Fonts file urls the css loads.
 */
export const getGoogleFontFileUrls = (css: string): Array<string> =>
  css.match(GOOGLE_FONT_FILE_URLS) ?? [];

/**
 * A font file the page's CSP blocked on an earlier load, as base64.
 */
export const readFontCache = (url: string): string | null => {
  try {
    return localStorage.getItem(fontCacheKey(url));
  } catch {
    return null;
  }
};

export const writeFontCache = (url: string, data: string): void => {
  try {
    localStorage.setItem(fontCacheKey(url), data);
  } catch {
    // localStorage may be unavailable or full; the next load will fetch the
    // font through the background again.
  }
};

/**
 * Removes cached font files that none of the css loads any more.
 */
export const pruneFontCache = (liveCss: Array<string>): void => {
  const liveUrls = new Set(liveCss.flatMap(getGoogleFontFileUrls));

  try {
    const staleKeys: Array<string> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key?.startsWith(FONT_CACHE_PREFIX) &&
        !liveUrls.has(key.slice(FONT_CACHE_PREFIX.length))
      ) {
        staleKeys.push(key);
      }
    }

    staleKeys.forEach(key => localStorage.removeItem(key));
  } catch {
    // localStorage may be unavailable; nothing to clean up then.
  }
};
