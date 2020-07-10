import {
  GetAllStylesRequest,
  SetAllStylesRequest,
  SetOptionRequest,
  GetAllOptionsRequest,
} from '../types/BackgroundPageRequest';

import {
  GetAllStylesResponse,
  GetAllOptionsResponse,
} from '../types/BackgroundPageResponse';

import { StylebotOptions } from '../types';

type Styles = {
  [url: string]: { css: string; enabled: boolean };
};

export const getAllStyles = async (): Promise<Styles> => {
  const request: GetAllStylesRequest = {
    name: 'getAllStyles',
  };

  return new Promise(resolve => {
    chrome.extension.sendRequest(request, (response: GetAllStylesResponse) => {
      resolve(response);
    });
  });
};

export const getAllOptions = async (): Promise<StylebotOptions> => {
  const request: GetAllOptionsRequest = {
    name: 'getAllOptions',
  };

  return new Promise(resolve => {
    chrome.extension.sendRequest(request, (response: GetAllOptionsResponse) => {
      resolve(response);
    });
  });
};

export const setAllStyles = (styles: Styles) => {
  const request: SetAllStylesRequest = {
    name: 'setAllStyles',
    styles,
  };

  chrome.extension.sendRequest(request);
};

export const setOption = (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
) => {
  const request: SetOptionRequest = {
    name: 'setOption',
    option: {
      name,
      value,
    },
  };

  chrome.extension.sendRequest(request);
};

export const copyToClipboard = (text: string) => {
  chrome.extension.sendRequest({
    name: 'copyToClipboard',
    text,
  });
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
