// chrome.storage has no synchronous equivalent, but localStorage does — so
// the last-applied result is cached here and reapplied synchronously before
// anything else runs, closing the flash-of-unstyled-content gap entirely on
// repeat visits. See index.ts for how a stale or missing cache is handled.
//
// One entry per origin (localStorage is already origin-scoped), rather than
// per exact URL, to keep this bounded. The trade-off: a page whose URL
// pattern differs from the last-cached page on the same origin may briefly
// show that other pattern's CSS before this run's storage check corrects it.
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
