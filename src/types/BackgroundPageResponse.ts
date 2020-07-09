import { StylebotOptions } from './';

export type GetAllOptionsResponse = { options: StylebotOptions };
export type GetOptionResponse = StylebotOptions[keyof StylebotOptions];

export type GetStylesForPageResponse = Array<{
  url: string;
  css: string;
  enabled: boolean;
}>;

export type GetMergedCssAndUrlForPageResponse = {
  url: string;
  css: string;
};

export type GetMergedCssAndUrlForIframeResponse = GetMergedCssAndUrlForPageResponse;

type BackgroundPageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetStylesForPageResponse
  | GetMergedCssAndUrlForPageResponse
  | GetMergedCssAndUrlForIframeResponse;

export default BackgroundPageResponse;
