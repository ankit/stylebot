import * as postcss from 'postcss';

import {
  SetOptionRequest,
  GetAllOptionsRequest,
  ViewOptionsPageRequest,
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
      resolve(response.options);
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
  important: boolean = true
): Promise<GetMergedCssAndUrlForPageResponse> => {
  const request: GetMergedCssAndUrlForPageRequest = {
    name: 'getMergedCssAndUrlForPage',
  };

  return new Promise(resolve => {
    chrome.extension.sendRequest(
      request,
      (response: GetMergedCssAndUrlForPageResponse) => {
        if (important) {
          resolve(response);
          return;
        }

        // todo: update interface for getMergedCssAndUrlForPage to avoid
        // this duplicate work.
        const { url, css } = response;
        const root = postcss.parse(css);

        root.walkDecls(decl => {
          decl.important = false;
        });

        resolve({ url, css: root.toString() });
      }
    );
  });
};

export const viewOptionsPage = () => {
  const request: ViewOptionsPageRequest = {
    name: 'viewOptionsPage',
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
