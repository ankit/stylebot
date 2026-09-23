import {
  Style,
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  Timestamp,
  GoogleDriveSyncMetadata,
  VersionHistory,
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

export type SyncFailure = {
  ok: false;
  errorKey: SyncErrorKey;
  errorDetail?: string;
};

export type ScanVersionHistoryResponse = { scan: VersionHistory };

export type RestoreVersionResponse = { ok: boolean };

export type GetRecentColorsResponse = Array<string>;
export type AddRecentColorResponse = Array<string>;
export type GetIsEditorWindowOpenResponse = boolean;

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
  | ScanVersionHistoryResponse
  | RestoreVersionResponse
  | GetRecentColorsResponse
  | AddRecentColorResponse
  | GetIsEditorWindowOpenResponse;

export default BackgroundPageMessageResponse;
