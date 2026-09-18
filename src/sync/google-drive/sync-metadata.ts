import { GoogleDriveSyncMetadata, SyncState } from '@stylebot/types';

const SYNC_STATE_KEY = 'google-drive-sync-state';
const LEGACY_METADATA_KEY = 'google-drive-sync';
const ACCESS_TOKEN_KEY = 'google-drive-access-token';

export const getSyncState = (): Promise<SyncState | undefined> =>
  new Promise(resolve => {
    chrome.storage.local.get(SYNC_STATE_KEY, items => {
      resolve(items[SYNC_STATE_KEY]);
    });
  });

export const setSyncState = (state: SyncState): Promise<void> =>
  new Promise(resolve => {
    chrome.storage.local.set(
      {
        [SYNC_STATE_KEY]: state,

        // Kept in step for one release so a rollback still finds its metadata.
        [LEGACY_METADATA_KEY]: state.metadata,
      },
      () => resolve()
    );
  });

export const clearSyncState = (): Promise<void> =>
  new Promise(resolve => {
    chrome.storage.local.remove(
      [SYNC_STATE_KEY, LEGACY_METADATA_KEY, ACCESS_TOKEN_KEY],
      () => resolve()
    );
  });

export const getGoogleDriveSyncMetadata = (): Promise<
  GoogleDriveSyncMetadata | undefined
> =>
  new Promise(resolve => {
    chrome.storage.local.get(SYNC_STATE_KEY, items => {
      resolve((items[SYNC_STATE_KEY] as SyncState | undefined)?.metadata);
    });
  });

export const getSyncLastSyncedAt = (): Promise<string | undefined> =>
  new Promise(resolve => {
    chrome.storage.local.get(SYNC_STATE_KEY, items => {
      resolve((items[SYNC_STATE_KEY] as SyncState | undefined)?.lastSyncedAt);
    });
  });

export const setGoogleDriveSyncEnabled = (enabled: boolean): void => {
  chrome.storage.local.set({ 'google-drive-sync-enabled': enabled });
};

export const getGoogleDriveSyncEnabled = (): Promise<boolean> => {
  return new Promise<boolean>(resolve => {
    chrome.storage.local.get('google-drive-sync-enabled', items => {
      resolve(items['google-drive-sync-enabled'] || false);
    });
  });
};

export const getLocalStylesMetadata = (): Promise<{ modifiedTime: string }> =>
  new Promise(resolve => {
    chrome.storage.local.get('styles-metadata', items => {
      const metadata = items['styles-metadata'];

      if (typeof metadata?.modifiedTime === 'string') {
        resolve(metadata);
        return;
      }

      // StylesMetadataUpdate repairs this on startup, but a caller racing it
      // must not be handed something it will dereference into Invalid Date.
      resolve({ modifiedTime: '' });
    });
  });
