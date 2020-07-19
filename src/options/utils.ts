import {
  GetAllStyles,
  SetAllStyles,
  SetOption,
  GetAllOptions,
  GetAllStylesResponse,
  GetAllOptionsResponse,
  StylebotOptions,
  CopyToClipboard,
} from '@stylebot/types';

type Styles = {
  [url: string]: {
    css: string;
    enabled: boolean;
    readability: boolean;
  };
};

export const getAllStyles = async (): Promise<Styles> => {
  const message: GetAllStyles = {
    name: 'GetAllStyles',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetAllStylesResponse) => {
      resolve(response);
    });
  });
};

export const getAllOptions = async (): Promise<StylebotOptions> => {
  const message: GetAllOptions = {
    name: 'GetAllOptions',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetAllOptionsResponse) => {
      resolve(response);
    });
  });
};

export const setAllStyles = (styles: Styles): void => {
  const message: SetAllStyles = {
    name: 'SetAllStyles',
    styles,
  };

  chrome.runtime.sendMessage(message);
};

export const setOption = (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
): void => {
  const message: SetOption = {
    name: 'SetOption',
    option: {
      name,
      value,
    },
  };

  chrome.runtime.sendMessage(message);
};

export const copyToClipboard = (text: string): void => {
  const message: CopyToClipboard = {
    name: 'CopyToClipboard',
    text,
  };

  chrome.runtime.sendMessage(message);
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
