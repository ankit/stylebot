import { injectCSSIntoDocument, removeCSSFromDocument } from '@stylebot/css';
import {
  apply as applyReadability,
  remove as removeReadability,
} from '@stylebot/readability';

import { CachedState } from './cache';

// Tracks which stylesheets are currently injected so a later call (once the
// real storage read resolves) can remove any that are no longer enabled.
let appliedUrls = new Set<string>();

export const applyState = (state: CachedState): Promise<void> => {
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

    if (state.readability) {
      applyReadability();
    } else {
      removeReadability();
    }
  });
};
