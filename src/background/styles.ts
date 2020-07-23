import * as postcss from 'postcss';

import BackgroundPageUtils from './utils';
import BrowserAction from './browseraction';

import {
  Style,
  StyleMap,
  StyleWithoutUrl,
  EnableStyleForTab,
  DisableStyleForTab,
} from '@stylebot/types';

class BackgroundPageStyles {
  styles: StyleMap;

  constructor(styles: StyleMap) {
    this.styles = styles;
  }

  get(url: string): StyleWithoutUrl {
    return this.styles[url];
  }

  getAll(): StyleMap {
    return this.styles;
  }

  setAll(styles: StyleMap): void {
    this.styles = styles;

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  set(url: string, css: string, readability: boolean): void {
    if (!css) {
      delete this.styles[url];
    } else {
      this.styles[url] = {
        css,
        readability,
        enabled: true,
      };
    }

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  enable(url: string): void {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = true;
    chrome.storage.local.set({
      styles: this.styles,
    });

    chrome.tabs.getSelected(tab => {
      if (tab && tab.url && tab.id) {
        const { styles } = this.getStylesForPage(tab.url);
        this.updateBrowserAction(tab, styles);

        const css = this.addImportantToCss(this.styles[url].css);
        const message: EnableStyleForTab = {
          name: 'EnableStyleForTab',
          url,
          css,
        };

        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  disable(url: string): void {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = false;
    chrome.storage.local.set({
      styles: this.styles,
    });

    chrome.tabs.getSelected(tab => {
      if (tab && tab.url && tab.id) {
        const { styles } = this.getStylesForPage(tab.url);
        this.updateBrowserAction(tab, styles);

        const message: DisableStyleForTab = {
          name: 'DisableStyleForTab',
          url,
        };

        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  }

  setReadability(url: string, value: boolean): void {
    if (this.styles[url]) {
      this.styles[url].readability = value;
    } else {
      this.styles[url] = {
        readability: value,
        enabled: true,
        css: '',
      };
    }

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  import(styles: StyleMap): void {
    for (const url in styles) {
      this.styles[url] = styles[url];
    }

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  move(src: string, dest: string): void {
    if (this.styles[src]) {
      this.styles[dest] = JSON.parse(JSON.stringify(this.styles[src]));
      delete this.styles[src];

      chrome.storage.local.set({
        styles: this.styles,
      });
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
          ? this.addImportantToCss(this.styles[url].css)
          : this.styles[url].css;

        const { enabled, readability } = this.styles[url];
        const style = { url, css, enabled, readability };

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

  addImportantToCss(css: string): string {
    const root = postcss.parse(css);

    root.walkDecls(decl => {
      decl.important = true;
    });

    return root.toString();
  }

  updateBrowserAction(
    tab: chrome.tabs.Tab,
    styles: Array<{ url: string; enabled: boolean; css: string }>
  ): void {
    if (!!styles.find(style => style.enabled)) {
      BrowserAction.highlight(tab);
    } else {
      BrowserAction.unhighlight(tab);
    }
  }
}

export default BackgroundPageStyles;
