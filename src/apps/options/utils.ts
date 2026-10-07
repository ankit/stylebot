import type {
  GetAllStyles,
  SetAllStyles,
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
  Timestamp,
} from '@stylebot/types';
import { t } from '@stylebot/i18n';
import {
  BACKUP_BEFORE_V4_KEY,
  MIGRATION_ERRORS_KEY,
  isStyleMap,
  sanitizeStyleMap,
} from '@stylebot/saved-styles';
import type { BackupBeforeV4 } from '@stylebot/saved-styles';

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

export const setAllStyles = (styles: StyleMap): void => {
  const message: SetAllStyles = {
    name: 'SetAllStyles',
    styles,
  };

  chrome.runtime.sendMessage(message);
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

export type StylesBeforeV4 = { styles: StyleMap; createdAt: Timestamp };

/**
 * The styles stored before 4.0's migrations ran and when they were backed up,
 * or null when there are none to restore: a fresh install, or a backup that
 * is not a style map.
 */
export const getStylesBeforeV4 = async (): Promise<StylesBeforeV4 | null> => {
  const { [BACKUP_BEFORE_V4_KEY]: backup } = await chrome.storage.local.get(
    BACKUP_BEFORE_V4_KEY
  );
  const { createdAt, items } = (backup as BackupBeforeV4 | undefined) ?? {};
  const styles = items?.styles;

  return createdAt && isStyleMap(styles) && Object.keys(styles).length > 0
    ? { styles: sanitizeStyleMap(styles), createdAt }
    : null;
};

/**
 * Whether a migration failed on the background's last start.
 */
export const getMigrationsFailed = async (): Promise<boolean> => {
  const { [MIGRATION_ERRORS_KEY]: errors } = await chrome.storage.local.get(
    MIGRATION_ERRORS_KEY
  );

  return Boolean(errors) && Object.keys(errors).length > 0;
};

export const importStylesWithFilePicker = (): Promise<StyleMap> => {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.addEventListener('change', (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files?.[0]) {
        const file = files[0];
        if (file.type && file.type !== 'application/json') {
          reject('Only JSON format is supported.');
          return;
        }

        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = () => {
          try {
            const styles: unknown = JSON.parse(reader.result as string);

            if (isStyleMap(styles)) {
              resolve(sanitizeStyleMap(styles));
            } else {
              reject(t('import_error_not_backup'));
            }
          } catch (e) {
            reject(e);
          }
        };

        reader.onerror = () => {
          reject(reader.error);
        };
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.remove();
  });
};

export const exportAsJSONFile = (styles: StyleMap): void => {
  const json = JSON.stringify(styles);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'stylebot_backup.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
