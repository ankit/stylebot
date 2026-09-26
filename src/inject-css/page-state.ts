import { applyReadability, removeReadability } from '@stylebot/readability';
import { getStylesForPage } from '@stylebot/styles';
import type { CompiledStyles } from '@stylebot/types';

import type { CachedState } from './cache';
import { writeCache } from './cache';
import { pruneImportCache } from './import-cache';
import { injectStylesheet, removeStylesheet } from './stylesheet';

/**
 * What this page should have applied: the compiled styles matching its url,
 * and whether its default style turns the reader on.
 */
export const getPageState = (compiled: CompiledStyles): CachedState => {
  const { styles, defaultStyle } = getStylesForPage(
    window.location.href,
    compiled.styles
  );

  return {
    styles: styles.map(({ url, css, importUrls, enabled }) => ({
      url,
      css,
      importUrls,
      enabled,
    })),
    readability: Boolean(defaultStyle?.readability),
  };
};

const enabledUrls = (state?: CachedState | null): Set<string> =>
  new Set(
    state?.styles.filter(style => style.enabled).map(style => style.url) ?? []
  );

/**
 * Applies a page state: the reader, then each enabled style. Stylesheets that
 * `previous` had enabled and this state doesn't are removed.
 */
export const applyPageState = (
  state: CachedState,
  previous?: CachedState | null
): void => {
  // Called synchronously, ahead of CSS injection below — readability's own
  // showLoader() needs to hide the page before the browser's first paint,
  // and waiting on style injection (which may fetch @imports) risks missing it.
  if (state.readability) {
    applyReadability();
  } else {
    removeReadability();
  }

  const nextUrls = enabledUrls(state);

  enabledUrls(previous).forEach(url => {
    if (!nextUrls.has(url)) {
      removeStylesheet(url);
    }
  });

  state.styles
    .filter(style => style.enabled)
    .forEach(style => injectStylesheet(style.url, style.css, style.importUrls));
};

/**
 * Records the applied state for the next load's first paint, and drops the
 * cached responses of imports it no longer uses.
 */
export const savePageState = (state: CachedState): void => {
  writeCache(state);
  pruneImportCache(new Set(state.styles.flatMap(style => style.importUrls)));
};
