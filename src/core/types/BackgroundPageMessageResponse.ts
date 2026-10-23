import type { CompiledStyles, Style, StyleMap } from './styles';
import type { StylebotOptions } from './options';
import type { StylebotCommands } from './commands';
import type { ReadabilitySettings } from './readability';
import type { GoogleDriveSyncMetadata } from './sync';
import type { RestoreResult, VersionHistory } from './history';
import type {
  GalleryAccount,
  GalleryUsernameCheck,
  GalleryPublished,
  GalleryPreview,
  GalleryPublishedStyle,
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

// The account is null while signed out, which only getting it reports.
export type GalleryAccountResponse = GalleryResult<{
  account: GalleryAccount | null;
}>;
export type CheckGalleryUsernameResponse = GalleryResult<GalleryUsernameCheck>;
export type GetMyGalleryStylesResponse = GalleryResult<{
  styles: Array<GalleryStyle>;
  // The style published from this Stylebot style and profile, if still listed.
  publishedId: number | null;
}>;
// The screenshot is a data URL.
export type GalleryScreenshotResponse = GalleryResult<{ screenshot: string }>;
export type PublishToGalleryResponse = GalleryResult<{
  style: GalleryPublishedStyle;
}>;
export type UnpublishFromGalleryResponse = GalleryResult;
// What the account published from a profile, or the gallery style the
// profile was installed from.
export type GetPublishedGalleryStyleResponse = {
  published: GalleryPublished | null;
  installed: { id: number; slug: string } | null;
};
export type GetGalleryStyleResponse = GalleryResult<{
  style: GalleryStyle;
}>;
// The page's gallery site, to browse the rest of its styles in the gallery.
export type GetGallerySuggestionsResponse = GalleryResult<{
  styles: Array<GalleryStyle>;
  site: string;
}>;
export type PreviewGalleryStyleResponse = GalleryResult;
// replacedUrl is only for the tab's own page, as in ShowGalleryPreview.
export type GetGalleryPreviewResponse = {
  preview: GalleryPreview | null;
  replacedUrl?: string;
};
// The profile name each requested gallery style is installed as, by its id.
export type GetGalleryInstallStatusResponse = {
  installed: Record<string, string>;
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
  | GalleryAccountResponse
  | GetMyGalleryStylesResponse
  | GalleryScreenshotResponse
  | PublishToGalleryResponse
  | UnpublishFromGalleryResponse
  | GetPublishedGalleryStyleResponse
  | GetGallerySuggestionsResponse
  | PreviewGalleryStyleResponse
  | GetGalleryPreviewResponse
  | InstallGalleryPreviewResponse
  | UndoGalleryInstallResponse
  | GetGalleryInstallStatusResponse;

export default BackgroundPageMessageResponse;
