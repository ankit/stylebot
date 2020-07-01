import * as postcss from 'postcss';
import { Style, StylebotBackgroundPage } from './types';

declare global {
  const CSSParser: any;
}

export const getFormattedStyles = (): Array<Style> => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
  const styles = backgroundPage.cache.styles.get();
  const urls = Object.keys(styles);

  return urls.map(url => ({
    url,
    css: styles[url].css,
    enabled: styles[url].enabled,
  }));
};

export const saveStyle = (initialUrl: string, url: string, css: string) => {
  const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;

  try {
    const postCSSAST = postcss.parse(css);

    backgroundPage.cache.styles.create(url, postCSSAST.toString());
    if (initialUrl && initialUrl !== url) {
      backgroundPage.cache.styles.delete(initialUrl);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
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
