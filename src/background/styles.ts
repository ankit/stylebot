import * as postcss from 'postcss';

import BrowserAction from './browseraction';
import BackgroundPageUtils from './utils';

type Style = {
  css: string;
  enabled: boolean;
};

type Styles = {
  [url: string]: Style;
};

class BackgroundPageStyles {
  styles: Styles;

  constructor(styles: Styles) {
    this.styles = styles;
  }

  /**
   * Get style for URL. If URL is not provided, return all styles
   */
  get(url?: string) {
    if (url === undefined) {
      return this.styles;
    } else {
      return this.styles[url];
    }
  }

  /**
   * Set style for URL
   */
  set(url: string, style: Style) {
    this.styles[url] = style;
    return this.styles[url];
  }

  /**
   * Save styles to chrome local storage
   */
  persist() {
    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  /**
   * Create new style for URL
   */
  create(url: string, css: string) {
    this.styles[url] = {
      css,
      enabled: true,
    };

    this.persist();
  }

  /**
   * Get if style is enabled for URL
   */
  isEnabled(url: string) {
    if (this.styles[url] === undefined) {
      return false;
    }

    return this.styles[url].enabled;
  }

  /**
   * Save the css for given URL. If css is empty, delete style for URL
   */
  save(url: string, css: string) {
    if (css) {
      this.create(url, css);
    } else {
      this.delete(url);
    }
  }

  /**
   * Toggle the enabled status for the given URL's style
   */
  toggle(url: string, shouldPersist: boolean) {
    if (this.isEmpty(url)) {
      return false;
    }

    this.styles[url].enabled = !this.styles[url].enabled;
    this.persist();
  }

  /**
   * Toggle the enabled status for all styles
   */
  toggleAll() {
    for (const url in this.styles) {
      this.toggle(url, false);
    }
  }

  /**
   * Delete style for URL
   */
  delete(url: string) {
    delete this.styles[url];
    this.persist();
  }

  /**
   * Delete all styles
   */
  deleteAll() {
    this.styles = {};
    this.persist();
  }

  /**
   * Return true if the URL does not have any associated style
   */
  isEmpty(url: string) {
    if (!this.styles[url]) {
      return true;
    }

    if (!this.styles[url].css) {
      return true;
    }

    return false;
  }

  /**
   * Import and merge styles, overwriting any existing styles for URLs
   */
  import(stylesToImport: Styles) {
    for (const url in stylesToImport) {
      this.styles[url] = stylesToImport[url];
    }

    this.persist();
  }

  /**
   * Get css for given URL
   */
  getCss(url: string) {
    if (!this.styles[url]) {
      return '';
    }

    return this.styles[url].css;
  }

  getStyleUrlMetadataForTab(tab: chrome.tabs.Tab) {
    if (!tab.url) {
      return;
    }

    if (!BackgroundPageUtils.isValidHTML(tab.url)) {
      return null;
    }

    const styleUrlMetadata = [];
    for (const styleUrl in this.styles) {
      if (
        BackgroundPageUtils.matchesPattern(tab.url, styleUrl) &&
        !this.isEmpty(styleUrl)
      ) {
        styleUrlMetadata.push({
          url: styleUrl,
          enabled: this.isEnabled(styleUrl),
        });
      }
    }

    return styleUrlMetadata;
  }

  /**
   * Get priority URL and merged css applicable for the given tab url
   */
  getComputedStylesForTab(tabUrl: string, tab: chrome.tabs.Tab) {
    if (!BackgroundPageUtils.isValidHTML(tabUrl)) {
      return { url: '', css: '' };
    }

    let url = '';
    let css = '';

    for (const styleUrl in this.styles) {
      if (!this.isEnabled(styleUrl)) {
        continue;
      }

      if (BackgroundPageUtils.matchesPattern(tabUrl, styleUrl)) {
        if (styleUrl.length > url.length) {
          url = styleUrl;
        }

        css = this.mergeCss(this.getCss(styleUrl), css, styleUrl === url);
      }
    }

    /* @ts-ignore */
    window.cache.loadingTabs[tab.id] = { url, css };
    BrowserAction.update(tab);

    return { url, css };
  }

  getComputedStylesForIframe(iframeUrl: string, tab: chrome.tabs.Tab) {
    /* @ts-ignore */
    const response = window.cache.loadingTabs[tab.id];
    return response ? response : this.getComputedStylesForTab(iframeUrl, tab);
  }

  /**
   * Copy styles from source to destination url
   */
  transfer(sourceUrl: string, destinationUrl: string) {
    if (this.styles[sourceUrl]) {
      this.styles[destinationUrl] = this.styles[sourceUrl];
      this.persist();
    }
  }

  mergeCss(sourceCss: string, destinationCss: string, isPriorityURL: boolean) {
    // todo: respect priority of url
    const root1 = postcss.parse(sourceCss);
    const root2 = postcss.parse(destinationCss);
    root1.append(root2);

    root1.walkDecls(decl => {
      decl.important = true;
    });

    return root1.toString();
  }

  updateStylesForTab(tab: chrome.tabs.Tab) {
    if (!tab.url || !tab.id) {
      return;
    }

    const response = this.getComputedStylesForTab(tab.url, tab);

    chrome.tabs.sendRequest(tab.id, {
      name: 'updateStyles',
      url: response.url,
      css: response.css,
    });
  }
}

export default BackgroundPageStyles;
