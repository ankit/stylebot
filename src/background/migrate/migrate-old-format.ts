import { defaultOptions } from '@stylebot/settings';
import { Style, StyleMap, StylebotOptions } from '@stylebot/types';

/* @ts-ignore */
import LegacyCssFormatter from './legacy-css-formatter';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const isNewFormat = (styles: any) => {
  const urls: Array<string> = Object.keys(styles);
  return !!urls.find(url => styles[url].css !== undefined);
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const backupV2Styles = (styles: any) => {
  return new Promise(resolve => {
    chrome.storage.local.set({ backup_v2_styles: styles }, () => {
      resolve();
    });
  });
};

export const getMigratedStyles = (): Promise<StyleMap> => {
  return new Promise(resolve => {
    chrome.storage.local.get('styles', async items => {
      const styles = items['styles'];

      if (!styles) {
        resolve({});
        return;
      }

      // check if styles are in the new format
      if (isNewFormat(styles)) {
        resolve(styles);
        return;
      }

      // backup old styles, in case we run into a bug
      await backupV2Styles(styles);

      const formatter = new LegacyCssFormatter();
      const urls: Array<string> = Object.keys(styles);

      const results: Array<Promise<Style>> = urls.map(
        async (url): Promise<Style> => {
          const style = styles[url];

          return new Promise(resolveStyle => {
            try {
              formatter.format(style._rules, false, (css: string) => {
                resolveStyle({
                  url,
                  css,
                  enabled: style._enabled,
                  readability: false,
                });
              });
            } catch (e) {
              // guard against badly formatted style
              resolveStyle({
                url,
                css: '',
                enabled: style._enabled,
                readability: false,
              });
            }
          });
        }
      );

      Promise.all(results).then(formattedStyles => {
        const newStyles: StyleMap = {};

        formattedStyles.forEach(({ url, css, enabled, readability }) => {
          newStyles[url] = { css, enabled, readability };
        });

        resolve(newStyles);
      });
    });
  });
};

export const getMigratedOptions = (): Promise<StylebotOptions> => {
  return new Promise(resolve => {
    chrome.storage.local.get('options', async items => {
      const options = items['options'];

      if (!options || !['basic', 'magic', 'code'].includes(options.mode)) {
        resolve(defaultOptions);
      } else {
        resolve(options);
      }
    });
  });
};

const MigrateOldFormat = async (): Promise<void> => {
  const styles = await getMigratedStyles();
  const options = await getMigratedOptions();

  return new Promise(resolve => {
    chrome.storage.local.set({ options, styles }, () => {
      resolve();
    });
  });
};

export default MigrateOldFormat;
