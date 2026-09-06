import * as postcss from 'postcss';

import { getCurrentTimestamp } from '@stylebot/utils';
import { getStylesForPage } from '@stylebot/styles';

import {
  Style,
  StyleMap,
  StyleWithoutUrl,
  ApplyStylesToTab,
  GetIsReadabilityActive,
} from '@stylebot/types';

export { getStylesForPage } from '@stylebot/styles';

// Whether the reader is actually mounted on this tab right now — asked live
// from the content script rather than tracked/persisted in the background,
// so there's no stale cached value to race against.
export const getIsReadabilityActive = (tabId: number): Promise<boolean> =>
  new Promise(resolve => {
    const message: GetIsReadabilityActive = { name: 'GetIsReadabilityActive' };

    chrome.tabs.sendMessage(tabId, message, (response: boolean) => {
      resolve(!!response);
    });
  });

// Signals "styles are applied here" — readability doesn't need its own
// color since the 📖 badge glyph already reads as distinct on its own.
const STYLES_APPLIED_BADGE_COLOR = '#2e8b57';
const DEFAULT_BADGE_COLOR = '#555';

export const updateIcon = (
  tab: chrome.tabs.Tab,
  styles: Array<Style>,
  readabilityActive: boolean
): void => {
  const enabledStyles = styles.filter(style => style.enabled);

  if (readabilityActive) {
    chrome.action.setBadgeBackgroundColor({
      color: DEFAULT_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({
      text: `📖`,
      tabId: tab.id,
    });
  } else if (enabledStyles.length > 0) {
    chrome.action.setBadgeBackgroundColor({
      color: STYLES_APPLIED_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({
      text: `${enabledStyles.length}`,
      tabId: tab.id,
    });
  } else {
    chrome.action.setBadgeBackgroundColor({
      color: DEFAULT_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({ text: '', tabId: tab.id });
  }
};

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
