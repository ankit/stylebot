import { COMPILED_STYLES_VERSION } from '@stylebot/styles';

// localStorage is readable synchronously (chrome.storage isn't), so the
// last-applied result is cached here, one entry per origin.
const CACHE_KEY = 'stylebot-cache';

// Mirrors the compiled style, so applying it at first paint parses nothing.
export type CachedStyle = {
  url: string;
  css: string;
  importUrls: Array<string>;
  enabled: boolean;
};

export type CachedState = {
  styles: Array<CachedStyle>;
  readability: boolean;
};

/**
 * The cached state, if it was written by this compiler version. Anything else,
 * including caches from before styles were compiled, reads as no cache and is
 * overwritten by the next write.
 */
export const readCache = (): CachedState | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cached = raw ? JSON.parse(raw) : null;

    if (cached?.version !== COMPILED_STYLES_VERSION) {
      return null;
    }

    return { styles: cached.styles, readability: cached.readability };
  } catch {
    return null;
  }
};

export const writeCache = (state: CachedState): void => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: COMPILED_STYLES_VERSION, ...state })
    );
  } catch {
    // localStorage may be unavailable (e.g. blocked by the page); the next
    // load will simply fall back to the hide-until-ready path again.
  }
};
