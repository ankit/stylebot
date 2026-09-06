import { ReadabilityTheme } from '@stylebot/types';

// Read synchronously so the loading screen can match the reader's theme
// immediately, instead of flashing white until settings are fetched.
const THEME_CACHE_KEY = 'stylebot-reader-theme';

const THEME_BACKGROUNDS: Record<ReadabilityTheme, string> = {
  light: '#faf8f3',
  sepia: '#f4ecd8',
  dark: '#201f1d',
};

export const cacheTheme = (theme: ReadabilityTheme): void => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
  }
};

/**
 * Hide document content until reader is ready
 * todo: optimize performance and UX when loading stylebot reader
 * currently, sometimes the page flashes before the reader content is loaded.
 * or a white screen appears for a prolonged period, especially for slower websites.
 */
export const showLoader = (): void => {
  const style = document.createElement('style');
  let cachedTheme: ReadabilityTheme | null = null;

  try {
    cachedTheme = localStorage.getItem(THEME_CACHE_KEY) as ReadabilityTheme | null;
  } catch {
    // localStorage may be unavailable; the loader just falls back to light.
  }

  const background = (cachedTheme && THEME_BACKGROUNDS[cachedTheme]) || THEME_BACKGROUNDS.light;

  style.type = 'text/css';
  style.setAttribute('id', 'stylebot-reader-loading');
  style.appendChild(
    document.createTextNode(
      `html { background: ${background} !important; } ` +
        'body { border: 0 !important; box-shadow: none !important; } ' +
        'body *:not(#stylebot) { display: none; }'
    )
  );

  document.documentElement.appendChild(style);
};

export const hideLoader = (): void => {
  document.getElementById('stylebot-reader-loading')?.remove();
};
