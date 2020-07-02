import { StylebotOptions } from '../../types';

export const getOptions = async () => {
  return new Promise(resolve => {
    chrome.extension.sendRequest(
      {
        name: 'getOptions',
      },
      response => {
        resolve(response.options);
      }
    );
  });
};

export const getComputedStylesForTab = async (): Promise<{
  url: string;
  css: string;
}> => {
  return new Promise(resolve => {
    chrome.extension.sendRequest(
      {
        name: 'getComputedStylesForTab',
      },
      response => {
        resolve(response);
      }
    );
  });
};

export const viewOptionsPage = () => {
  chrome.extension.sendRequest({
    name: 'showOptions',
  });
};

export const saveCss = (url: string, css: string) => {
  chrome.extension.sendRequest({
    name: 'save',
    css,
    url,
  });
};
