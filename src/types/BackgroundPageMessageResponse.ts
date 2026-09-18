import {
  Style,
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  Timestamp,
} from '@stylebot/types';

export type GetAllOptionsResponse = StylebotOptions;
export type GetOptionResponse = StylebotOptions[keyof StylebotOptions];

export type GetAllStylesResponse = {
  [url: string]: {
    css: string;
    enabled: boolean;
    readability: boolean;
    modifiedTime: Timestamp;
  };
};

export type GetStylesForPageResponse = {
  styles: Array<Style>;
  defaultStyle?: Style;
};

export type GetCommandsResponse = StylebotCommands;
export type GetReadabilitySettingsResponse = ReadabilitySettings;

export type GetImportCssResponse = string;
export type GetGoogleWebFontExistsResponse = boolean;
export type RunGoogleDriveSyncResponse = void;

export type GetRecentColorsResponse = Array<string>;
export type AddRecentColorResponse = Array<string>;

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse
  | GetGoogleWebFontExistsResponse
  | RunGoogleDriveSyncResponse
  | GetRecentColorsResponse
  | AddRecentColorResponse;

export default BackgroundPageMessageResponse;
