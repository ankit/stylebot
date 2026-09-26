import { getReadabilitySettings } from '@stylebot/settings';
import type { ReadabilityTheme } from '@stylebot/types';

import { loaderCss, LOADER_ART_ID } from './loader-styles';
import { THEME_BACKGROUNDS, THEME_FOREGROUNDS } from '../theme-colors';

// Read synchronously so the loading screen can match the reader's theme
// immediately, instead of flashing white until settings are fetched.
const THEME_CACHE_KEY = 'stylebot-reader-theme';

// Skeleton article: an accent title line over paragraph lines of varied width
// (the last one short, like a paragraph's final line). Widths in %.
const LOADER_LINES: Array<{ width: number; title?: boolean }> = [
  { width: 40, title: true },
  { width: 100 },
  { width: 96 },
  { width: 99 },
  { width: 82 },
];

/**
 * Remembers the reader's theme so the next loader paint can match it.
 */
export const cacheTheme = (theme: ReadabilityTheme): void => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
  }
};

const readCachedTheme = (): ReadabilityTheme | null => {
  try {
    return localStorage.getItem(THEME_CACHE_KEY) as ReadabilityTheme | null;
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
    return null;
  }
};

/**
 * Paints the loading screen's background and skeleton in the given theme.
 */
const paintLoader = (
  style: HTMLStyleElement,
  theme: ReadabilityTheme | null
): void => {
  const background =
    (theme && THEME_BACKGROUNDS[theme]) || THEME_BACKGROUNDS.light;
  const foreground =
    (theme && THEME_FOREGROUNDS[theme]) || THEME_FOREGROUNDS.light;

  // Set inline (not via <style>) so it commits before any CSSOM parse/recalc,
  // ahead of the browser's first paint.
  document.documentElement.style.setProperty(
    'background',
    background,
    'important'
  );
  style.textContent = loaderCss(
    { background, foreground },
    LOADER_LINES.length
  );
};

/**
 * Hides document content and paints a themed loading screen until reader is ready.
 * The first paint uses this site's cached theme, which goes stale when the theme
 * is changed on another site, so it's repainted once the saved theme is read.
 */
export const showLoader = (): void => {
  const cachedTheme = readCachedTheme();

  const style = document.createElement('style');
  style.type = 'text/css';
  style.setAttribute('id', 'stylebot-reader-loading');
  paintLoader(style, cachedTheme);
  document.documentElement.appendChild(style);

  const art = document.createElement('div');
  art.setAttribute('id', LOADER_ART_ID);
  LOADER_LINES.forEach(({ width, title }) => {
    const line = document.createElement('i');
    if (title) {
      line.className = 'title';
    }
    line.style.width = `${width}%`;
    art.appendChild(line);
  });
  document.documentElement.appendChild(art);

  getReadabilitySettings()
    .then(({ theme }) => {
      if (theme !== cachedTheme && style.isConnected) {
        paintLoader(style, theme);
      }
      cacheTheme(theme);
    })
    .catch(() => undefined);
};

/**
 * Removes the loading screen and its inline background override.
 */
export const hideLoader = (): void => {
  document.getElementById('stylebot-reader-loading')?.remove();
  document.getElementById(LOADER_ART_ID)?.remove();
  // Drop the inline background set in showLoader so the original page (on
  // revert) isn't left with the loader's theme color painted over it.
  document.documentElement.style.removeProperty('background');
};
