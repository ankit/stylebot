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

export const deleteStyle = (url: string) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.delete(url);
};

export const enableStyle = (url: string) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.toggle(url, true, true);
};

export const disableStyle = (url: string) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.toggle(url, false, true);
};

export const enableAllStyles = () => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.toggleAll(true);
};

export const disableAllStyles = () => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.toggleAll(false);
};

export const deleteAllStyles = () => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.cache.styles.deleteAll();
};

export const getOptions = () => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  return backgroundPage.cache.options;
};

export const saveOption = (name: string, value: boolean | string | number) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  backgroundPage.saveOption(name, value);
};

export const getCharacterFromKeydownCode = (code: number): string => {
  const flooredCode = Math.floor(code);

  switch (flooredCode) {
    case 186:
      return ';';
    case 187:
      return '=';
    case 188:
      return ',';
    case 189:
      return '-';
    case 190:
      return '.';
    case 191:
      return '/';
    case 192:
      return '`';
    case 219:
      return '[';
    case 220:
      return '\\';
    case 221:
      return ']';
    case 222:
      return "'";
  }

  return String.fromCharCode(flooredCode).toLowerCase();
};

export const getKeydownCode = (char: string): number => {
  return char.toUpperCase().charCodeAt(0);
};

export const exportStylesAsJSONString = () => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;

  if (backgroundPage.cache.styles) {
    return JSON.stringify(backgroundPage.cache.styles.get(), null, 2);
  } else {
    return '';
  }
};

export const importStylesFromJSONString = (json: string): boolean => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;

  try {
    const styles = JSON.parse(json);
    backgroundPage.cache.styles.import(styles);
  } catch (e) {
    return false;
  }

  return true;
};

export const copyToClipboard = (text: string) => {
  chrome.extension.sendRequest({
    name: 'copyToClipboard',
    text: text,
  });
};
