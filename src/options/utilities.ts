import { Style, StylebotBackgroundPage } from './types';

declare global {
  const CSSParser: any;
  const CSSUtils: any;
}

export const getFormattedStyles = async (): Promise<Array<Style>> => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  const styles = backgroundPage.cache.styles.get();
  const urls = Object.keys(styles);

  const results = urls.map(
    async (url): Promise<Style> => {
      const style = styles[url];

      return new Promise(resolve => {
        CSSUtils.crunchFormattedCSS(
          style._rules,
          false,
          false,
          (css: string) => {
            resolve({
              url,
              css,
              enabled: style._enabled,
            });
          }
        );
      });
    }
  );

  return new Promise(resolve => {
    Promise.all(results).then(formattedStyles => resolve(formattedStyles));
  });
};

export const saveStyle = (initialUrl: string, url: string, css: string) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;

  const parser = new CSSParser();
  const sheet = parser.parse(css, false, true);

  if (sheet) {
    try {
      const rules = CSSUtils.getRulesFromParserObject(sheet);

      // Syntax error.
      if (rules['error']) {
        return false;
      }

      backgroundPage.cache.styles.create(url, rules);

      if (initialUrl && initialUrl !== url) {
        backgroundPage.cache.styles.delete(initialUrl);
      }

      return true;
    } catch (e) {
      // TODO: Handle error properly here
      return true;
    }
  }

  return true;
};
