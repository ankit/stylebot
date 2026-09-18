import {
  Style,
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  Timestamp,
  GoogleDriveSyncMetadata,
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

/**
 * Locale keys rather than raw messages, so a Drive failure can be shown in
 * the user's language instead of English from the API response.
 */
export type SyncErrorKey =
  | 'sync_error_auth'
  | 'sync_error_network'
  | 'sync_error_not_found'
  | 'sync_error_parse'
  | 'sync_error_not_enabled'
  | 'sync_error_unknown';

export type RunGoogleDriveSyncResponse =
  | { ok: true; metadata: GoogleDriveSyncMetadata }
  | { ok: false; errorKey: SyncErrorKey; errorDetail?: string };

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse
  | RunGoogleDriveSyncResponse;

export default BackgroundPageMessageResponse;
