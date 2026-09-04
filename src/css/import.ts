import * as postcss from 'postcss';

import { GetImportCss, GetImportCssResponse } from '@stylebot/types';

// Strips @import rules out so the rest of the CSS can be applied without
// waiting on a network fetch for them.
export const extractImports = (
  css: string
): { css: string; importUrls: Array<string> } => {
  const root = postcss.parse(css);
  const importUrls: Array<string> = [];

  root.walkAtRules('import', (atRule: postcss.AtRule) => {
    const regex = /^(url\()?([^\)]*)(\))?$/;
    const paramsWithoutQuotes = atRule.params
      .replace(/"/g, '')
      .replace(/\'/g, '');
    const matches = paramsWithoutQuotes.match(regex);

    if (matches) {
      importUrls.push(matches[2]);
      atRule.remove();
    }
  });

  return { css: root.toString(), importUrls };
};

// Fetches one @import's CSS via the background service worker, to get
// around CORS.
export const fetchImportCss = (url: string): Promise<string> =>
  new Promise(resolve => {
    const message: GetImportCss = { name: 'GetImportCss', url };

    chrome.runtime.sendMessage(message, (response: GetImportCssResponse) => {
      resolve(response);
    });
  });

export const getCssWithExpandedImports = async (
  css: string
): Promise<string> => {
  const { css: withoutImports, importUrls } = extractImports(css);
  const values = await Promise.all(importUrls.map(fetchImportCss));
  const merged = values.join('\n\n');

  return merged ? `${merged}\n\n${withoutImports}` : withoutImports;
};
