import * as postcss from 'postcss';

import { GetImportCss, GetImportCssResponse } from '@stylebot/types';

// fetch and expand all imports for external CSS to get around CORS
export const getCssWithExpandedImports = (css: string): Promise<string> => {
  return new Promise(resolve => {
    const root = postcss.parse(css);
    const urls: Array<string> = [];

    root.walkAtRules('import', (atRule: postcss.AtRule) => {
      const regex = /^(url\()?([^\)]*)(\))?$/;
      const paramsWithoutQuotes = atRule.params
        .replace(/"/g, '')
        .replace(/\'/g, '');
      const matches = paramsWithoutQuotes.match(regex);

      if (matches) {
        urls.push(matches[2]);
        atRule.remove();
      }
    });

    const promises: Array<Promise<string>> = urls.map(url => {
      return new Promise(urlResolve => {
        const message: GetImportCss = {
          name: 'GetImportCss',
          url,
        };

        chrome.runtime.sendMessage(
          message,
          (response: GetImportCssResponse) => {
            urlResolve(response);
          }
        );
      });
    });

    let output = root.toString();
    Promise.all(promises).then((values: Array<string>) => {
      const merged = values.join('\n\n');
      if (merged) {
        output = `${merged}\n\n${output}`;
      }

      resolve(output);
    });
  });
};
