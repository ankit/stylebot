import { applyReadability, removeReadability } from '@stylebot/readability';

import type { CachedState } from './cache';
import { injectStylesheet, removeStylesheet } from './stylesheet';

// Tracks which stylesheets are currently injected so a later call (once the
// real storage read resolves) can remove any that are no longer enabled.
let appliedUrls = new Set<string>();

/**
 * Applies a page state: the reader, then each enabled style. Stylesheets that
 * this script applied before, or that `previous` had enabled, are removed if
 * the state no longer enables them.
 */
export const applyState = (
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

  const enabled = state.styles.filter(style => style.enabled);
  const nextUrls = new Set(enabled.map(style => style.url));

  const previousUrls = new Set(appliedUrls);
  previous?.styles
    .filter(style => style.enabled)
    .forEach(style => previousUrls.add(style.url));

  previousUrls.forEach(url => {
    if (!nextUrls.has(url)) {
      removeStylesheet(url);
    }
  });

  enabled.forEach(style =>
    injectStylesheet(style.url, style.css, style.importUrls)
  );

  appliedUrls = nextUrls;
};
