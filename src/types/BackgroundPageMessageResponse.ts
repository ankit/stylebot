import {
  StylebotOptions,
  Style,
  StylebotCommand,
  ReadabilitySettings,
} from './';

export type GetAllOptionsResponse = StylebotOptions;
export type GetOptionResponse = StylebotOptions[keyof StylebotOptions];

export type GetAllStylesResponse = {
  [url: string]: {
    css: string;
    enabled: boolean;
    readability: boolean;
  };
};

export type GetStylesForPageResponse = {
  styles: Array<Style>;
  defaultStyle?: Style;
};

export type GetAllCommandsResponse = Array<{
  shortcut: string;
  description: string;
  name: StylebotCommand;
}>;

export type GetReadabilitySettingsResponse = ReadabilitySettings;

export type GetImportCssResponse = string;

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetAllCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse;

export default BackgroundPageMessageResponse;
