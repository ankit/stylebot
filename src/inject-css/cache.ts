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
 * Caches written before styles were compiled hold raw css and no import urls;
 * they read as no cache, so the next write simply overwrites them.
 */
const isCompiledState = (state: CachedState): boolean =>
  Array.isArray(state?.styles) &&
  state.styles.every(style => Array.isArray(style.importUrls));

export const readCache = (): CachedState | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const state = raw ? JSON.parse(raw) : null;
    return state && isCompiledState(state) ? state : null;
  } catch {
    return null;
  }
};

export const writeCache = (state: CachedState): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (e.g. blocked by the page); the next
    // load will simply fall back to the hide-until-ready path again.
  }
};
