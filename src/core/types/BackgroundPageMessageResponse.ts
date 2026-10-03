import type { Timestamp } from './shared';
import type { CompiledStyles, Style } from './styles';
import type { StylebotOptions } from './options';
import type { StylebotCommands } from './commands';
import type { ReadabilitySettings } from './readability';
import type { GoogleDriveSyncMetadata } from './sync';
import type { VersionHistory } from './history';
import type { ChatErrorKey, ChatStatus, ChatTurn } from './chat';

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
export type GetCompiledStylesResponse = CompiledStyles;
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

export type ScanVersionHistoryResponse = { scan: VersionHistory };

export type RestoreVersionResponse = { ok: boolean };

export type GetRecentColorsResponse = Array<string>;
export type AddRecentColorResponse = Array<string>;
export type GetIsEditorWindowOpenResponse = boolean;
export type OpenEditorSidePanelResponse = boolean;

export type ChatStatusResponse = ChatStatus;
export type ChatConnectResponse =
  | { ok: true; status: ChatStatus }
  | { ok: false; errorKey: ChatErrorKey; errorDetail?: string };
export type ChatGetThreadResponse = Array<ChatTurn>;

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | GetCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse
  | GetCompiledStylesResponse
  | GetGoogleWebFontExistsResponse
  | RunGoogleDriveSyncResponse
  | ScanVersionHistoryResponse
  | RestoreVersionResponse
  | GetRecentColorsResponse
  | AddRecentColorResponse
  | GetIsEditorWindowOpenResponse
  | OpenEditorSidePanelResponse
  | ChatStatusResponse
  | ChatConnectResponse
  | ChatGetThreadResponse;

export default BackgroundPageMessageResponse;
