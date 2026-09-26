import * as postcss from 'postcss';

import { markDeclarationsImportant } from './declaration';
import { removeImports } from './import';

/**
 * Turns a style's css into what gets injected: its `@import` rules taken out,
 * and `!important` forced onto its declarations unless the style opts out.
 * The editor injects this directly, and the background stores it for pages.
 */
export const compileStyle = (
  css: string,
  { forceImportant = false }: { forceImportant?: boolean } = {}
): { css: string; importUrls: Array<string> } => {
  const root = postcss.parse(css);
  const importUrls = removeImports(root);

  if (forceImportant) {
    markDeclarationsImportant(root);
  }

  return { css: root.toString(), importUrls };
};
