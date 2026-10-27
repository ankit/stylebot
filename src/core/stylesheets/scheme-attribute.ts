import type { StyleColorScheme } from '@stylebot/types';

export const SCHEME_ATTRIBUTE = 'data-stylebot-scheme';

/**
 * Sets the color scheme a style asked for on <html>, or removes it when no
 * style asks for one.
 */
export const setSchemeAttribute = (scheme?: StyleColorScheme): void => {
  const root = document.documentElement;

  if (scheme) {
    root.setAttribute(SCHEME_ATTRIBUTE, scheme);
  } else {
    root.removeAttribute(SCHEME_ATTRIBUTE);
  }
};
