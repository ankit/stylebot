import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
import { appendImportantToDeclarations } from '@stylebot/css';

import {
  Style,
  StyleMap,
  StyleWithoutUrl,
  ApplyStylesToTab,
} from '@stylebot/types';

import BackgroundPageUtils from './utils';

export const updateIcon = (
  tab: chrome.tabs.Tab,
  styles: Array<Style>,
  defaultStyle?: Style
): void => {
  const enabledStyles = styles.filter(style => style.enabled);

  if (defaultStyle && defaultStyle.readability) {
    chrome.action.setBadgeText({
      text: `R`,
      tabId: tab.id,
    });
  } else if (enabledStyles.length > 0) {
    chrome.action.setBadgeText({
      text: `${enabledStyles.length}`,
      tabId: tab.id,
    });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tab.id });
  }
};

export const updateAllTabs = async (): Promise<void> => {
  const allStyles = await getAll();

  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      if (tab && tab.url && tab.id) {
        const { styles, defaultStyle } = getStylesForPage(tab.url, allStyles);

        const message: ApplyStylesToTab = {
          name: 'ApplyStylesToTab',
          defaultStyle,
          styles,
        };

        chrome.tabs.sendMessage(tab.id, message);

        if (tab.active) {
          updateIcon(tab, styles, defaultStyle);
        }
      }
    });
  });
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

export const getStylesForPage = (
  pageUrl: string,
  allStyles: StyleMap,
  important = false
): {
  styles: Array<Style>;
  defaultStyle?: Style;
} => {
  if (!pageUrl) {
    return { styles: [] };
  }

  if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
    return { styles: [] };
  }

  const styles = [];
  let defaultStyle: Style | undefined;

  for (const url in allStyles) {
    const matches = BackgroundPageUtils.matches(pageUrl, url);

    if (matches && allStyles[url]) {
      const css = important
        ? appendImportantToDeclarations(allStyles[url].css)
        : allStyles[url].css;

      const { enabled, readability, modifiedTime } = allStyles[url];
      const style = { url, css, enabled, readability, modifiedTime };

      if (url !== '*') {
        if (!defaultStyle || url.length > defaultStyle.url.length) {
          defaultStyle = style;
        }
      }

      if (style.css) {
        styles.push(style);
      }
    }
  }

  return { styles, defaultStyle };
};

export const setAll = async (styles: StyleMap): Promise<void> => {
  chrome.storage.local.set({
    styles,

    'styles-metadata': {
      modifiedTime: getCurrentTimestamp(),
    },
  });

  return updateAllTabs();
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
