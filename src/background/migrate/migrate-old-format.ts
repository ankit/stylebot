/* @ts-ignore */
import LegacyCssFormatter from './legacy-css-formatter';
import { Style, StyleMap, StylebotOptions } from '@stylebot/types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const isNewFormat = (styles: any) => {
  const urls: Array<string> = Object.keys(styles);
  return !!urls.find(url => !!styles[url].css);
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
      const oldStyles = items['styles'];

      if (!oldStyles) {
        resolve({});
        return;
      }

      // test to ensure styles are not already in the new format
      if (isNewFormat(oldStyles)) {
        resolve(oldStyles);
        return;
      }

      // backup old styles, in case we run into a bug
      await backupV2Styles(oldStyles);

      const formatter = new LegacyCssFormatter();
      const urls: Array<string> = Object.keys(oldStyles);

      const results: Array<Promise<Style>> = urls.map(
        async (url): Promise<Style> => {
          const style = oldStyles[url];

          return new Promise(resolveStyle => {
            formatter.format(style._rules, false, (css: string) => {
              resolveStyle({
                url,
                css,
                enabled: style._enabled,
                readability: false,
              });
            });
          });
        }
      );

      Promise.all(results).then(formattedStyles => {
        const styles: StyleMap = {};

        formattedStyles.forEach(({ url, css, enabled, readability }) => {
          styles[url] = { css, enabled, readability };
        });

        resolve(styles);
      });
    });
  });
};

export const getMigratedOptions = (): Promise<StylebotOptions> => {
  return new Promise(resolve => {
    chrome.storage.local.get('options', async items => {
      const options = items['options'];

      if (!options || !['basic', 'magic', 'code'].includes(options.mode)) {
        resolve({ mode: 'basic', contextMenu: true });
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
