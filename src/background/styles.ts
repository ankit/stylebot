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

class BackgroundPageStyles {
  styles: StyleMap;

  constructor(styles: StyleMap) {
    this.styles = styles;
  }

  persistStorage(): void {
    chrome.storage.local.set({
      styles: this.styles,

      'styles-metadata': {
        modifiedTime: getCurrentTimestamp(),
      },
    });
  }

  get(url: string): StyleWithoutUrl {
    return this.styles[url];
  }

  getAll(): StyleMap {
    return this.styles;
  }

  setAll(styles: StyleMap, shouldPersist = true): void {
    this.styles = styles;

    if (shouldPersist) {
      this.persistStorage();
    }

    this.updateAllTabs();
  }

  set(url: string, css: string, readability: boolean): void {
    if (!css) {
      delete this.styles[url];
    } else {
      this.styles[url] = {
        css,
        readability,
        enabled: true,
        modifiedTime: getCurrentTimestamp(),
      };
    }

    this.persistStorage();
  }

  enable(url: string): void {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = true;
    this.persistStorage();
    this.updateAllTabs();
  }

  disable(url: string): void {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = false;
    this.persistStorage();
    this.updateAllTabs();
  }

  setReadability(url: string, value: boolean): void {
    if (this.styles[url]) {
      this.styles[url].readability = value;
    } else {
      this.styles[url] = {
        css: '',
        enabled: true,
        readability: value,
        modifiedTime: getCurrentTimestamp(),
      };
    }

    this.persistStorage();
  }

  move(src: string, dest: string): void {
    if (this.styles[src]) {
      this.styles[dest] = JSON.parse(JSON.stringify(this.styles[src]));
      delete this.styles[src];

      this.persistStorage();
    }
  }

  getStylesForPage(
    pageUrl: string,
    important = false
  ): {
    styles: Array<Style>;
    defaultStyle?: Style;
  } {
    if (!pageUrl) {
      return { styles: [] };
    }

    if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
      return { styles: [] };
    }

    const styles = [];

    let defaultStyle: Style | undefined;

    for (const url in this.styles) {
      const matches = BackgroundPageUtils.matchesPattern(pageUrl, url);

      if (matches && this.styles[url]) {
        const css = important
          ? appendImportantToDeclarations(this.styles[url].css)
          : this.styles[url].css;

        const { enabled, readability, modifiedTime } = this.styles[url];
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
  }

  getImportCss(url: string): Promise<string> {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          try {
            const css = xhr.responseText;
            // validate css by parsing
            postcss.parse(css);
            resolve(css);
          } catch (e) {
            // if css is invalid, return back empty css
            resolve('');
          }
        }
      };

      xhr.send();
    });
  }

  updateIcon(
    tab: chrome.tabs.Tab,
    styles: Array<Style>,
    defaultStyle?: Style
  ): void {
    const enabledStyles = styles.filter(style => style.enabled);

    if (defaultStyle && defaultStyle.readability) {
      chrome.browserAction.setBadgeText({
        text: `R`,
        tabId: tab.id,
      });
    } else if (enabledStyles.length > 0) {
      chrome.browserAction.setBadgeText({
        text: `${enabledStyles.length}`,
        tabId: tab.id,
      });
    } else {
      chrome.browserAction.setBadgeText({ text: '', tabId: tab.id });
    }
  }

  updateAllTabs(): void {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (tab && tab.url && tab.id) {
          const { styles, defaultStyle } = this.getStylesForPage(tab.url, true);

          const message: ApplyStylesToTab = {
            name: 'ApplyStylesToTab',
            defaultStyle,
            styles,
          };

          chrome.tabs.sendMessage(tab.id, message);

          if (tab.active) {
            this.updateIcon(tab, styles, defaultStyle);
          }
        }
      });
    });
  }
}

export default BackgroundPageStyles;
