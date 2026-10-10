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
} from '@stylebot/types';

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
