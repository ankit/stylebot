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

  get(url: string) {
    return this.styles[url];
  }

  getAll() {
    return this.styles;
  }

  setAll(styles: Styles) {
    this.styles = styles;

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  set(url: string, css: string) {
    if (!css) {
      delete this.styles[url];
    } else {
      this.styles[url] = {
        css,
        enabled: true,
      };
    }

    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  enable(url: string) {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = true;
    chrome.storage.local.set({
      styles: this.styles,
    });
  }

  disable(url: string) {
    if (!this.styles[url]) {
      return;
    }

    this.styles[url].enabled = false;
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
    pageUrl: string
  ): Array<{ url: string; css: string; enabled: boolean }> {
    if (!pageUrl) {
      return [];
    }

    if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
      return [];
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

  getMergedCssAndUrlForIframe(iframeUrl: string): { url: string; css: string } {
    return this.getMergedCssAndUrlForPage(iframeUrl);
  }

  getMergedCss(src: string, dest: string): string {
    const root1 = postcss.parse(src);
    const root2 = postcss.parse(dest);

    root1.append(root2);
    root1.walkDecls(decl => {
      decl.important = true;
    });

    return root1.toString();
  }
}

export default BackgroundPageStyles;
