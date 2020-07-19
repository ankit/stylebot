import {
  SetOptionRequest,
  GetAllOptionsRequest,
  OpenOptionsPageRequest,
  SetStyleRequest,
  EnableStyleRequest,
  DisableStyleRequest,
  GetStylesForPageRequest,
  SetReadabilityRequest,
  GetAllOptionsResponse,
  GetStylesForPageResponse,
  StylebotOptions,
} from '@stylebot/types';

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

export const setOption = (
  name: string,
  value: StylebotOptions[keyof StylebotOptions]
): void => {
  const request: SetOptionRequest = {
    name: 'setOption',
    option: {
      name,
      value,
    },
  };

  chrome.extension.sendRequest(request);
};

export const getStylesForPage = async (
  important: boolean
): Promise<GetStylesForPageResponse> => {
  const request: GetStylesForPageRequest = {
    name: 'getStylesForPage',
    important,
  };

  return new Promise(resolve => {
    chrome.extension.sendRequest(
      request,
      (response: GetStylesForPageResponse) => {
        resolve(response);
      }
    );
  });
};

export const openOptionsPage = (): void => {
  const request: OpenOptionsPageRequest = {
    name: 'openOptionsPage',
  };

  chrome.extension.sendRequest(request);
};

export const setStyle = (url: string, css: string): void => {
  const request: SetStyleRequest = {
    name: 'setStyle',
    url,
    css,
  };

  chrome.extension.sendRequest(request);
};

export const enableStyle = (url: string): void => {
  const request: EnableStyleRequest = {
    name: 'enableStyle',
    url,
  };

  chrome.extension.sendRequest(request);
};

export const disableStyle = (url: string): void => {
  const request: DisableStyleRequest = {
    name: 'disableStyle',
    url,
  };

  chrome.extension.sendRequest(request);
};

export const setReadability = (url: string, value: boolean): void => {
  const request: SetReadabilityRequest = {
    name: 'setReadability',
    value,
    url,
  };

  chrome.extension.sendRequest(request);
};
