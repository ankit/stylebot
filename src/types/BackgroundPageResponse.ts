import { StylebotOptions, Style } from './';

export type GetAllOptionsResponse = StylebotOptions;
export type GetOptionResponse = StylebotOptions[keyof StylebotOptions];

export type GetAllStylesResponse = {
  [url: string]: {
    css: string;
    enabled: boolean;
  };
};
export type GetStylesForPageResponse = Array<Style>;

export type GetMergedCssAndUrlForPageResponse = {
  url: string;
  css: string;
};

export type GetMergedCssAndUrlForIframeResponse = GetMergedCssAndUrlForPageResponse;

type BackgroundPageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetMergedCssAndUrlForPageResponse
  | GetMergedCssAndUrlForIframeResponse;

export default BackgroundPageResponse;
