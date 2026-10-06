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
} from '@stylebot/types';
import { createBackup } from '@stylebot/saved-styles';
import { getCurrentTimestamp } from '@stylebot/utils';

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
export const scanVersionHistory = async (
  limit?: number
): Promise<VersionHistory> => {
  const message: ScanVersionHistory = { name: 'ScanVersionHistory', limit };

  const response = await chrome.runtime.sendMessage<
    ScanVersionHistory,
    ScanVersionHistoryResponse | undefined
  >(message);

  return (
    response?.scan ?? { versions: [], previews: {}, changes: {}, total: 0 }
  );
};

export const restoreVersion = async (
  versionId: string,
  urls?: Array<string>
): Promise<boolean> => {
  const message: RestoreVersion = {
    name: 'RestoreVersion',
    versionId,
    urls,
  };

  const response = await chrome.runtime.sendMessage<
    RestoreVersion,
    RestoreVersionResponse | undefined
  >(message);

  return Boolean(response?.ok);
};

/**
 * Asks for a backup file and resolves with its text, or with null when the
 * picker is closed without choosing one.
 */
export const pickBackupFile = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';

    fileInput.addEventListener('cancel', () => resolve(null));
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      file.text().then(resolve, reject);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.remove();
  });
};

export const exportAsJSONFile = (styles: StyleMap): void => {
  const json = JSON.stringify(createBackup(styles, getCurrentTimestamp()));
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'stylebot_backup.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
