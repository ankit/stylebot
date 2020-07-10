import * as postcss from 'postcss';

import {
  SetOptionRequest,
  GetAllOptionsRequest,
  OpenOptionsPageRequest,
  SetStyleRequest,
  GetMergedCssAndUrlForPageRequest,
} from '../../types/BackgroundPageRequest';

import {
  GetAllOptionsResponse,
  GetMergedCssAndUrlForPageResponse,
} from '../../types/BackgroundPageResponse';

import { StylebotOptions } from '../../types';

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

export const getMergedCssAndUrlForPage = async (
  important: boolean
): Promise<GetMergedCssAndUrlForPageResponse> => {
  const request: GetMergedCssAndUrlForPageRequest = {
    name: 'getMergedCssAndUrlForPage',
    important,
  };

  return new Promise(resolve => {
    chrome.extension.sendRequest(
      request,
      (response: GetMergedCssAndUrlForPageResponse) => {
        resolve(response);
      }
    );
  });
};

export const openOptionsPage = () => {
  const request: OpenOptionsPageRequest = {
    name: 'openOptionsPage',
  };

  chrome.extension.sendRequest(request);
};

export const setStyle = (url: string, css: string) => {
  const request: SetStyleRequest = {
    name: 'setStyle',
    url,
    css,
  };

  chrome.extension.sendRequest(request);
};
