import * as postcss from 'postcss';
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
   * Get style for given url
   */
  get(url: string) {
    return this.styles[url];
  }

  /**
   * Get all styles
   */
  getAll() {
    return this.styles;
  }

  /**
   * Set new style for URL
   */
  set(url: string, css: string) {
    this.styles[url] = {
      css,
      enabled: true,
    };

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  /**
   * Delete style for URL
   */
  delete(url: string) {
    delete this.styles[url];

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  /**
   * Delete all styles
   */
  deleteAll() {
    this.styles = {};

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  /**
   * Toggle the enabled status for the given URL's style
   */
  toggle(url: string) {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = !this.styles[url].enabled;

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  /**
   * Toggle the enabled status for all styles
   */
  toggleAll() {
    for (const url in this.styles) {
      this.toggle(url);
    }
  }

  /**
   * Add styles, overwriting any conflicting existing styles
   */
  import(styles: Styles) {
    for (const url in styles) {
      this.styles[url] = styles[url];
    }

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  getStylesForPage(pageUrl: string) {
    if (!pageUrl) {
      return null;
    }

    if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
      return null;
    }

    const styles = [];
    for (const url in this.styles) {
      const matches = BackgroundPageUtils.matchesPattern(pageUrl, url);

      if (matches && this.styles[url]) {
        styles.push({
          url,
          css: this.styles[url].css,
          enabled: this.styles[url].enabled,
        });
      }
    }

    return styles;
  }

  /**
   * Get merged css and url from given set of styles
   *
   * Currently, in case multiple styles exist are enabled for the page,
   * we merge the css and return the longest url.
   *
   * This has the implicit side effect that the css for the longest url
   * gets implicitly updated to include the css from other urls.
   *
   * todo: improve this behavior to remove the side effect
   */
  getMergedCssAndUrlForPage(pageUrl: string): { url: string; css: string } {
    const styles = this.getStylesForPage(pageUrl);

    if (!styles) {
      return { css: '', url: '' };
    }

    let css = '';
    let url = '';

    styles.forEach(styleDef => {
      if (styleDef.enabled) {
        if (styleDef.url > url) {
          url = styleDef.url;
        }

        css = this.getMergedCss(styleDef.css, css);
      }
    });

    return { url, css };
  }

  getMergedCssAndUrlForIframe(iframeUrl: string) {
    return this.getMergedCssAndUrlForPage(iframeUrl);
  }

  getMergedCss(src: string, dest: string) {
    const root1 = postcss.parse(src);
    const root2 = postcss.parse(dest);

    root1.append(root2);
    root1.walkDecls(decl => {
      decl.important = true;
    });

    return root1.toString();
  }

  /**
   * Move styles from source to destination url
   */
  move(src: string, dest: string) {
    if (this.styles[src]) {
      this.styles[dest] = JSON.parse(JSON.stringify(this.styles[src]));
      delete this.styles[src];

      chrome.storage.local.set({
        styles: this.styles,
      });
    }
  }
}

export default BackgroundPageStyles;
