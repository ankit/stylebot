import type { CompiledStyles, Style, StyleMap } from './styles';
import type { StylebotOptions } from './options';
import type { StylebotCommands } from './commands';
import type { ReadabilitySettings } from './readability';
import type { GoogleDriveSyncMetadata } from './sync';
import type { RestoreResult, VersionHistory } from './history';
import type {
  GalleryDraft,
  GalleryInstalled,
  GalleryPublished,
  GalleryPublishStatus,
  GalleryPreview,
  GalleryResult,
  GalleryStyle,
} from './gallery';

export type GetAllOptionsResponse = StylebotOptions;
export type GetOptionResponse = StylebotOptions[keyof StylebotOptions];

export type GetAllStylesResponse = StyleMap;

export type SetAllStylesResponse = { ok: boolean };

export type CreateProfileResponse = {
  profileId: string;
};

// Left out when the install was refused.
export type InstallStyleResponse = {
  profileName?: string;
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
// The font file as base64, or empty when it couldn't be fetched.
export type GetGoogleFontFileResponse = string;

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

export type RestoreVersionResponse = RestoreResult;

export type UndoRestoreResponse = { ok: boolean };

export type GetRecentColorsResponse = Array<string>;
export type AddRecentColorResponse = Array<string>;
export type GetIsEditorWindowOpenResponse = boolean;
export type OpenEditorSidePanelResponse = boolean;
export type RestoreTabResponse = { ok: true };

// The screenshot is a data URL.
export type GalleryScreenshotResponse = GalleryResult<{ screenshot: string }>;
export type OpenGalleryDraftResponse = GalleryResult;
// Null for a draft that's unknown, expired or already published.
export type GetGalleryDraftResponse = { draft: GalleryDraft | null };
export type GalleryDraftPublishedResponse = { ok: boolean };
export type GalleryStyleDeletedResponse = { ok: boolean };
// What was published from a profile, or the gallery style the profile was
// installed from.
export type GetPublishedGalleryStyleResponse = {
  published: GalleryPublished | null;
  installed: GalleryInstalled | null;
};
// Fails when the gallery can't be reached or no longer has the style.
export type ResetGalleryProfileResponse = GalleryResult;
export type GetGalleryStyleResponse = GalleryResult<{
  style: GalleryStyle;
}>;
// The page's gallery site, to browse the rest of its styles in the gallery,
// and how many it has there.
export type GetGallerySuggestionsResponse = GalleryResult<{
  styles: Array<GalleryStyle>;
  total: number;
  site: string;
}>;
export type PreviewGalleryStyleResponse = GalleryResult;
// replacedUrl is only for the tab's own page, as in ShowGalleryPreview.
export type GetGalleryPreviewResponse = {
  preview: GalleryPreview | null;
  replacedUrl?: string;
};
// The profile name each requested gallery style is installed as, and for the
// gallery, which were published from here, by their ids.
export type GetGalleryInstallStatusResponse = {
  installed: Record<string, string>;
  published: Record<string, GalleryPublishStatus>;
};
export type InstallGalleryPreviewResponse = GalleryResult<{
  profileName: string;
}>;
export type UndoGalleryInstallResponse = GalleryResult;

type BackgroundPageMessageResponse =
  | GetAllOptionsResponse
  | GetOptionResponse
  | GetAllStylesResponse
  | GetStylesForPageResponse
  | CreateProfileResponse
  | InstallStyleResponse
  | GetCommandsResponse
  | GetReadabilitySettingsResponse
  | GetImportCssResponse
  | GetCompiledStylesResponse
  | GetGoogleWebFontExistsResponse
  | GetGoogleFontFileResponse
  | RunGoogleDriveSyncResponse
  | ScanVersionHistoryResponse
  | RestoreVersionResponse
  | UndoRestoreResponse
  | SetAllStylesResponse
  | GetRecentColorsResponse
  | AddRecentColorResponse
  | GetIsEditorWindowOpenResponse
  | OpenEditorSidePanelResponse
  | RestoreTabResponse
  | GalleryScreenshotResponse
  | OpenGalleryDraftResponse
  | GetGalleryDraftResponse
  | GalleryDraftPublishedResponse
  | GalleryStyleDeletedResponse
  | GetPublishedGalleryStyleResponse
  | ResetGalleryProfileResponse
  | GetGallerySuggestionsResponse
  | PreviewGalleryStyleResponse
  | GetGalleryPreviewResponse
  | InstallGalleryPreviewResponse
  | UndoGalleryInstallResponse
  | GetGalleryInstallStatusResponse;

export default BackgroundPageMessageResponse;
