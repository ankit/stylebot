// localStorage is readable synchronously (chrome.storage isn't), so the
// last-applied result is cached here, one entry per origin.
const CACHE_KEY = 'stylebot-cache';

export type CachedStyle = { url: string; css: string; enabled: boolean };

export type CachedState = {
  styles: Array<CachedStyle>;
  readability: boolean;
};

export const readCache = (): CachedState | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
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
