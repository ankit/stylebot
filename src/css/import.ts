import * as postcss from 'postcss';

import { fetchImportCss } from '@stylebot/inject-css';

/**
 * Strips @import rules out of the parsed css, so the rest of it can be
 * applied without waiting on a network fetch for them, and returns their urls.
 */
export const removeImports = (root: postcss.Root): Array<string> => {
  const importUrls: Array<string> = [];

  root.walkAtRules('import', (atRule: postcss.AtRule) => {
    const regex = /^(url\()?([^)]*)(\))?$/;
    const paramsWithoutQuotes = atRule.params
      .replace(/"/g, '')
      .replace(/'/g, '');
    const matches = paramsWithoutQuotes.match(regex);

    if (matches) {
      importUrls.push(matches[2]);
      atRule.remove();
    }
  });

  return importUrls;
};

export const extractImports = (
  css: string
): { css: string; importUrls: Array<string> } => {
  const root = postcss.parse(css);
  const importUrls = removeImports(root);

  return { css: root.toString(), importUrls };
};

export const getCssWithExpandedImports = async (
  css: string
): Promise<string> => {
  const { css: withoutImports, importUrls } = extractImports(css);
  const values = await Promise.all(importUrls.map(fetchImportCss));
  const merged = values.join('\n\n');

  return merged ? `${merged}\n\n${withoutImports}` : withoutImports;
};
