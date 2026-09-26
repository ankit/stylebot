import { THEMES, type ThemeKey } from './themes';

/**
 * The theme currently applied to <html>, set before first paint by the
 * inline script in the base layout.
 */
export function currentTheme(): ThemeKey {
  const key = document.documentElement.dataset.theme;
  return key && key in THEMES ? (key as ThemeKey) : 'light';
}
