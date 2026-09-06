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

export const setAll = async (styles: StyleMap): Promise<void> => {
  chrome.storage.local.set({
    styles,

    'styles-metadata': {
      modifiedTime: getCurrentTimestamp(),
    },
  });
};

export const set = async (
  url: string,
  css: string,
  readability: boolean
): Promise<void> => {
  const styles = await getAll();

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

  return setAll(styles);
};

export const enable = async (url: string): Promise<void> => {
  const styles = await getAll();

  if (!styles[url]) {
    return;
  }

  styles[url].enabled = true;
  return setAll(styles);
};

export const disable = async (url: string): Promise<void> => {
  const styles = await getAll();

  if (!styles[url]) {
    return;
  }

  styles[url].enabled = false;
  return setAll(styles);
};

export const setReadability = async (
  url: string,
  value: boolean
): Promise<void> => {
  const styles = await getAll();

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

  return setAll(styles);
};

export const move = async (src: string, dest: string): Promise<void> => {
  const styles = await getAll();

  if (styles[src]) {
    styles[dest] = JSON.parse(JSON.stringify(styles[src]));
    delete styles[src];

    return setAll(styles);
  }
};

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
