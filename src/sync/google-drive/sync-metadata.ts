import { GoogleDriveSyncMetadata, SyncState } from '@stylebot/types';

const SYNC_STATE_KEY = 'google-drive-sync-state';
const LEGACY_METADATA_KEY = 'google-drive-sync';
const ACCESS_TOKEN_KEY = 'google-drive-access-token';

export const getSyncState = async (): Promise<SyncState | undefined> => {
  const items = await chrome.storage.local.get(SYNC_STATE_KEY);
  return items[SYNC_STATE_KEY];
};

export const setSyncState = (state: SyncState): Promise<void> =>
  chrome.storage.local.set({ [SYNC_STATE_KEY]: state });

// The legacy key is only ever read by the migration; it is listed here so
// disconnecting also sweeps it off profiles that upgraded.
export const clearSyncState = (): Promise<void> =>
  chrome.storage.local.remove([
    SYNC_STATE_KEY,
    LEGACY_METADATA_KEY,
    ACCESS_TOKEN_KEY,
  ]);

export const getGoogleDriveSyncMetadata = async (): Promise<
  GoogleDriveSyncMetadata | undefined
> => (await getSyncState())?.metadata;

export const getLastSyncedAt = async (): Promise<string | undefined> =>
  (await getSyncState())?.lastSyncedAt;

export const setGoogleDriveSyncEnabled = (enabled: boolean): void => {
  chrome.storage.local.set({ 'google-drive-sync-enabled': enabled });
};

export const getGoogleDriveSyncEnabled = async (): Promise<boolean> => {
  const items = await chrome.storage.local.get('google-drive-sync-enabled');
  return items['google-drive-sync-enabled'] || false;
};

export const getLocalStylesMetadata = async (): Promise<{
  modifiedTime: string;
}> => {
  const items = await chrome.storage.local.get('styles-metadata');
  const metadata = items['styles-metadata'];

  if (typeof metadata?.modifiedTime === 'string') {
    return metadata;
  }

  // StylesMetadataUpdate repairs this on startup, but a caller racing it
  // must not be handed something it will dereference into Invalid Date.
  return { modifiedTime: '' };
};
