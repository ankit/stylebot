import { injectCSSIntoDocument, removeCSSFromDocument } from '@stylebot/css';
// removeReadability alone doesn't need Defuddle or the reader's Vue app —
// bypassing the @stylebot/readability barrel (see applyReadability below)
// keeps this eager import cheap for the common case (readability off).
import { removeReadability } from '../readability/lifecycle/remove-readability';

import { CachedState } from './cache';

// Tracks which stylesheets are currently injected so a later call (once the
// real storage read resolves) can remove any that are no longer enabled.
let appliedUrls = new Set<string>();

export const applyState = (state: CachedState): Promise<void> => {
  // Fired here, ahead of CSS injection below — readability's own
  // showLoader() needs to hide the page before the browser's first paint,
  // and waiting on style injection (which may fetch @imports) risks missing
  // it. Not awaited: this must stay fire-and-forget, matching the
  // synchronous call it replaces — the dynamic import only defers pulling
  // in Defuddle and the reader's own Vue app until a page actually needs
  // them, which is a small minority of page loads.
  if (state.readability) {
    import(
      /* webpackChunkName: "readability-lazy" */ '@stylebot/readability'
    ).then(({ applyReadability }) => applyReadability());
  } else {
    removeReadability();
  }

  const enabled = state.styles.filter(style => style.enabled);
  const nextUrls = new Set(enabled.map(style => style.url));

  appliedUrls.forEach(url => {
    if (!nextUrls.has(url)) {
      removeCSSFromDocument(url);
    }
  });

  const injections = enabled.map(style =>
    injectCSSIntoDocument(style.css, style.url)
  );

  return Promise.all(injections).then(() => {
    appliedUrls = nextUrls;
  });
};
