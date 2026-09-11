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
export type RunGoogleDriveSyncResponse = void;

export type GenerateCssResponse =
  | {
      css: string;
      message: string;
      userContent: string;
      assistantContent: string;
      cost: number;
      error?: undefined;
    }
  | {
      css?: undefined;
      message?: undefined;
      userContent?: undefined;
      assistantContent?: undefined;
      cost?: undefined;
      error: string;
    };

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse
  | RunGoogleDriveSyncResponse
  | GenerateCssResponse;

export default BackgroundPageMessageResponse;
