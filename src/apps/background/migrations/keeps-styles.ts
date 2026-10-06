import type { StyleMap } from '@stylebot/types';

/**
 * Throws unless `after` keeps everything `before` had: every style, any css,
 * and every profile. A migration that rewrites styles checks its result with
 * this before writing it, so a bug in it cannot lose a user's styles.
 */
export const assertKeepsStyles = (before: StyleMap, after: StyleMap): void => {
  for (const url in before) {
    const previous = before[url];
    const next = after[url];

    if (!next) {
      throw new Error(`Would drop the style for ${url}`);
    }

    if (previous.css && !next.css) {
      throw new Error(`Would clear the css of ${url}`);
    }

    for (const id in previous.profiles ?? {}) {
      if (!next.profiles?.[id]) {
        throw new Error(`Would drop profile ${id} of ${url}`);
      }
    }
  }
};
