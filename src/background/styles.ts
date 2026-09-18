import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
import { getStylesForPage } from '@stylebot/styles';

import { StyleMap, StyleWithoutUrl, ApplyStylesToTab } from '@stylebot/types';

import { getIsReadabilityActive, updateIcon } from './badge';

export { getStylesForPage } from '@stylebot/styles';

export const applyStylesToAllTabs = async (): Promise<void> => {
  const allStyles = await getAll();

  chrome.tabs.query({}, tabs => {
    tabs.forEach(async tab => {
      if (tab && tab.url && tab.id) {
        const { styles, defaultStyle } = getStylesForPage(tab.url, allStyles);

        const message: ApplyStylesToTab = {
          name: 'ApplyStylesToTab',
          defaultStyle,
          styles,
        };

        chrome.tabs.sendMessage(tab.id, message);

        if (tab.active) {
          const readabilityActive = await getIsReadabilityActive(tab.id);
          updateIcon(tab, styles, readabilityActive);
        }
      }
    });
  });
};

export const refreshBadgeForTab = async (tab: chrome.tabs.Tab): Promise<void> => {
  if (!tab.url || tab.id === undefined) {
    return;
  }

  const allStyles = await getAll();
  const { styles } = getStylesForPage(tab.url, allStyles);
  const readabilityActive = await getIsReadabilityActive(tab.id);
  updateIcon(tab, styles, readabilityActive);
};

export const getAll = (): Promise<StyleMap> =>
  new Promise(resolve => {
    chrome.storage.local.get('styles', items => {
      if (items['styles']) {
        resolve(items['styles']);
      } else {
        resolve({});
      }
    });
  });

export const get = async (url: string): Promise<StyleWithoutUrl> => {
  const styles = await getAll();
  return styles[url];
};

const writeToStorage = (styles: StyleMap): Promise<void> =>
  new Promise(resolve => {
    chrome.storage.local.set(
      {
        styles,

        'styles-metadata': {
          modifiedTime: getCurrentTimestamp(),
        },
      },
      resolve
    );
  });

/**
 * Chains writes so each mutation reads styles only after the prior write
 * finished, preventing concurrent writes (e.g. rapid keystrokes in the code
 * editor) from clobbering each other.
 */
let pendingWrite = Promise.resolve();

export const setAll = (styles: StyleMap): Promise<void> => {
  pendingWrite = pendingWrite.then(() => writeToStorage(styles));
  return pendingWrite;
};

const update = (
  mutate: (styles: StyleMap) => StyleMap | undefined
): Promise<void> => {
  pendingWrite = pendingWrite.then(async () => {
    const styles = mutate(await getAll());

    if (styles) {
      await writeToStorage(styles);
    }
  });

  return pendingWrite;
};

export const set = (
  url: string,
  css: string,
  readability: boolean
): Promise<void> =>
  update(styles => {
    if (!css) {
      delete styles[url];
    } else {
      styles[url] = {
        css,
        readability,
        enabled: true,
        modifiedTime: getCurrentTimestamp(),
      };
    }

    return styles;
  });

export const enable = (url: string): Promise<void> =>
  update(styles => {
    if (!styles[url]) {
      return undefined;
    }

    styles[url].enabled = true;
    return styles;
  });

export const disable = (url: string): Promise<void> =>
  update(styles => {
    if (!styles[url]) {
      return undefined;
    }

    styles[url].enabled = false;
    return styles;
  });

export const setReadability = (url: string, value: boolean): Promise<void> =>
  update(styles => {
    if (styles[url]) {
      styles[url].readability = value;
    } else {
      styles[url] = {
        css: '',
        enabled: true,
        readability: value,
        modifiedTime: getCurrentTimestamp(),
      };
    }

    return styles;
  });

export const move = (src: string, dest: string): Promise<void> =>
  update(styles => {
    if (!styles[src]) {
      return undefined;
    }

    styles[dest] = JSON.parse(JSON.stringify(styles[src]));
    delete styles[src];

    return styles;
  });

export const getImportCss = (url: string): Promise<string> => {
  return new Promise(resolve => {
    fetch(url)
      .then(response => response.text())
      .then(css => {
        postcss.parse(css);
        resolve(css);
      })
      .catch(() => {
        // if css is invalid, return back empty css
        resolve('');
      });
  });
};
