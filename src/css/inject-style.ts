import { injectStylesheet, removeStylesheet } from '@stylebot/inject-css';

import { compileStyle } from './compile';

/**
 * Applies the non-`@import` CSS immediately and patches in any `@import`
 * content once it's fetched, so a slow import fetch (e.g. a cold background
 * service worker) never blocks the rest of the stylesheet from applying.
 * forceImportant marks the stylesheet's own declarations `!important`.
 */
export const injectCSSIntoDocument = async (
  css: string,
  id: string,
  { forceImportant = false }: { forceImportant?: boolean } = {}
): Promise<void> => {
  const compiled = compileStyle(css, { forceImportant });
  injectStylesheet(id, compiled.css, compiled.importUrls);
};

export const removeCSSFromDocument = (id: string): void => {
  removeStylesheet(id);
};
