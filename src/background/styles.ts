import * as postcss from 'postcss';
import BackgroundPageUtils from './utils';
import BrowserAction from './browseraction';

type Style = {
  css: string;
  enabled: boolean;
  readability: boolean;
};

type Styles = {
  [url: string]: Style;
};

class BackgroundPageStyles {
  styles: Styles;

  constructor(styles: Styles) {
    this.styles = styles;
  }

  get(url: string): Style {
    return this.styles[url];
  }

  getAll(): Styles {
    return this.styles;
  }

  setAll(styles: Styles): void {
    this.styles = styles;

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  set(url: string, css: string): void {
    if (!css) {
      delete this.styles[url];
    } else {
      this.styles[url] = {
        css,
        enabled: true,
        readability: false,
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

        chrome.tabs.sendRequest(tab.id, {
          name: 'enableStyle',
          url,
          css,
        });
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

        chrome.tabs.sendRequest(tab.id, {
          name: 'disableStyle',
          url,
        });
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

  import(styles: Styles): void {
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
    styles: Array<Style & { url: string }>;
    defaultStyle?: Style & { url: string };
  } {
    if (!pageUrl) {
      return { styles: [] };
    }

    if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
      return { styles: [] };
    }

    const styles = [];

    let defaultStyle: (Style & { url: string }) | undefined;

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
