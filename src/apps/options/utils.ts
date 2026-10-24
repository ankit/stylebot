import type {
  GetAllStyles,
  SetAllStyles,
  SetAllStylesResponse,
  SetOption,
  GetAllOptions,
  GetAllStylesResponse,
  GetAllOptionsResponse,
  StylebotOptions,
  GetCommands,
  GetCommandsResponse,
  StyleMap,
  RunGoogleDriveSync,
  RunGoogleDriveSyncResponse,
  VersionHistory,
  ScanVersionHistory,
  ScanVersionHistoryResponse,
  RestoreVersion,
  RestoreVersionResponse,
  RestoreOptions,
  RestoreResult,
  UndoRestore,
  UndoRestoreResponse,
  ReloadForSidePanelGrant,
  GetGalleryStyle,
  PublishProfileToGallery,
  GetGalleryStyleResponse,
} from '@stylebot/types';
import { requestSidePanelPermission } from '@stylebot/side-panel';

export const getAllStyles = (): Promise<GetAllStylesResponse> => {
  const message: GetAllStyles = {
    name: 'GetAllStyles',
  };

  return chrome.runtime.sendMessage<GetAllStyles, GetAllStylesResponse>(
    message
  );
};

export const getAllOptions = (): Promise<StylebotOptions> => {
  const message: GetAllOptions = {
    name: 'GetAllOptions',
  };

  return chrome.runtime.sendMessage<GetAllOptions, GetAllOptionsResponse>(
    message
  );
};

/**
 * Replaces every saved style, resolving with whether the background stored
 * them. A torn-down worker answering with nothing counts as a failure.
 */
export const setAllStyles = async (styles: StyleMap): Promise<boolean> => {
  const message: SetAllStyles = {
    name: 'SetAllStyles',
    styles,
  };

  try {
    const response = await chrome.runtime.sendMessage<
      SetAllStyles,
      SetAllStylesResponse | undefined
    >(message);

    return Boolean(response?.ok);
  } catch {
    return false;
  }
};

export const setOption = (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
): void => {
  const message: SetOption = {
    name: 'SetOption',
    option: {
      name,
      value,
    },
  };

  chrome.runtime.sendMessage(message);
};

export const getCommands = (): Promise<GetCommandsResponse> => {
  const message: GetCommands = {
    name: 'GetCommands',
  };

  return chrome.runtime.sendMessage<GetCommands, GetCommandsResponse>(message);
};

export const runGoogleDriveSync =
  async (): Promise<RunGoogleDriveSyncResponse> => {
    const message: RunGoogleDriveSync = {
      name: 'RunGoogleDriveSync',
    };

    try {
      const response = await chrome.runtime.sendMessage<
        RunGoogleDriveSync,
        RunGoogleDriveSyncResponse | undefined
      >(message);

      // A service worker torn down mid-sync answers with undefined. Without
      // this the caller would treat that as a result.
      return response ?? { ok: false, errorKey: 'sync_error_unknown' };
    } catch (e) {
      return {
        ok: false,
        errorKey: 'sync_error_unknown',
        errorDetail: e instanceof Error ? e.message : undefined,
      };
    }
  };

/**
 * A torn-down worker answering with undefined is read as an empty history,
 * which is what someone with no history has.
 */
export const scanVersionHistory = async ({
  limit,
  site,
}: { limit?: number; site?: string } = {}): Promise<VersionHistory> => {
  const message: ScanVersionHistory = {
    name: 'ScanVersionHistory',
    limit,
    site,
  };

  const response = await chrome.runtime.sendMessage<
    ScanVersionHistory,
    ScanVersionHistoryResponse | undefined
  >(message);

  return response?.scan ?? { versions: [], hasMore: false, sites: [] };
};

export const restoreVersion = async (
  versionId: string,
  { urls, before, profileId }: RestoreOptions = {}
): Promise<RestoreResult> => {
  const message: RestoreVersion = {
    name: 'RestoreVersion',
    versionId,
    urls,
    before,
    profileId,
  };

  const response = await chrome.runtime.sendMessage<
    RestoreVersion,
    RestoreVersionResponse | undefined
  >(message);

  return response ?? { ok: false };
};

/**
 * Takes back the restore that recorded `entryId`.
 */
export const undoRestore = async (
  entryId: string,
  profileId?: string
): Promise<boolean> => {
  const message: UndoRestore = { name: 'UndoRestore', entryId, profileId };

  const response = await chrome.runtime.sendMessage<
    UndoRestore,
    UndoRestoreResponse | undefined
  >(message);

  return Boolean(response?.ok);
};

/**
 * Asks for the sidePanel permission during the click that picks the side
 * panel, then has Stylebot reload for it and show Options again, so the
 * editor opens in the side panel from the first time.
 */
export const grantSidePanel = (): void => {
  requestSidePanelPermission().then(granted => {
    if (granted) {
      const message: ReloadForSidePanelGrant = {
        name: 'ReloadForSidePanelGrant',
      };

      chrome.runtime.sendMessage(message);
    }
  });
};

export const getGalleryStyle = (
  styleId: number
): Promise<GetGalleryStyleResponse> =>
  chrome.runtime.sendMessage<GetGalleryStyle, GetGalleryStyleResponse>({
    name: 'GetGalleryStyle',
    styleId,
  });

/**
 * Opens a draft of a profile on the gallery's publish page, without a
 * screenshot, since there's no page here to capture.
 */
export const publishProfileToGallery = (
  url: string,
  profileId: string
): void => {
  const message: PublishProfileToGallery = {
    name: 'PublishProfileToGallery',
    url,
    profileId,
  };

  chrome.runtime.sendMessage(message);
};
