import { ReadabilityTheme } from '@stylebot/types';

import { loaderCss, LOADER_ART_ID } from './loader-styles';

// Read synchronously so the loading screen can match the reader's theme
// immediately, instead of flashing white until settings are fetched.
const THEME_CACHE_KEY = 'stylebot-reader-theme';

const THEME_BACKGROUNDS: Record<ReadabilityTheme, string> = {
  light: '#faf8f3',
  sepia: '#f4ecd8',
  dark: '#201f1d',
};

// Muted foreground per theme (matches the reader's own body text tones) —
// used for the faint skeleton lines so they read against the themed background.
const THEME_FOREGROUNDS: Record<ReadabilityTheme, string> = {
  light: '#2b2926',
  sepia: '#5b4636',
  dark: '#cac5bc',
};

// Skeleton article: an accent title line over paragraph lines of varied width
// (the last one short, like a paragraph's final line). Widths in %.
const LOADER_LINES: Array<{ width: number; title?: boolean }> = [
  { width: 40, title: true },
  { width: 100 },
  { width: 96 },
  { width: 99 },
  { width: 82 },
];

export const cacheTheme = (theme: ReadabilityTheme): void => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
  }
};

// Hide document content until reader is ready.
export const showLoader = (): void => {
  let cachedTheme: ReadabilityTheme | null = null;

  try {
    cachedTheme = localStorage.getItem(THEME_CACHE_KEY) as ReadabilityTheme | null;
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
  }

  const background = (cachedTheme && THEME_BACKGROUNDS[cachedTheme]) || THEME_BACKGROUNDS.light;
  const foreground = (cachedTheme && THEME_FOREGROUNDS[cachedTheme]) || THEME_FOREGROUNDS.light;

  // Set inline (not via <style>) so it commits before any CSSOM parse/recalc,
  // ahead of the browser's first paint.
  document.documentElement.style.setProperty('background', background, 'important');

  const style = document.createElement('style');
  style.type = 'text/css';
  style.setAttribute('id', 'stylebot-reader-loading');
  style.appendChild(
    document.createTextNode(loaderCss({ background, foreground }, LOADER_LINES.length))
  );
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
};

export const hideLoader = (): void => {
  document.getElementById('stylebot-reader-loading')?.remove();
  document.getElementById(LOADER_ART_ID)?.remove();
  // Drop the inline background set in showLoader so the original page (on
  // revert) isn't left with the loader's theme color painted over it.
  document.documentElement.style.removeProperty('background');
};
