import { STYLES_METADATA_KEY } from '@stylebot/styles';
import type { SyncState } from '@stylebot/types';

const SYNC_STATE_KEY = 'google-drive-sync-state';
const LEGACY_METADATA_KEY = 'google-drive-sync';
const ACCESS_TOKEN_KEY = 'google-drive-access-token';
const NEEDS_AUTH_KEY = 'google-drive-sync-needs-auth';

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
    NEEDS_AUTH_KEY,
  ]);

/**
 * Drops a url from the recorded conflicts once the user has looked at it.
 */
export const dismissSyncConflict = async (url: string): Promise<void> => {
  const state = await getSyncState();

  if (!state?.conflicts) {
    return;
  }

  await setSyncState({
    ...state,
    conflicts: state.conflicts.filter(conflict => conflict.url !== url),
  });
};

/**
 * Set when a scheduled sync could not get a token without showing an auth
 * window, so the popup and Sync tab can ask for a sign-in instead of
 * silently doing nothing until the next manual sync.
 */
export const setSyncNeedsAuth = (needsAuth: boolean): Promise<void> =>
  chrome.storage.local.set({ [NEEDS_AUTH_KEY]: needsAuth });

export const getSyncNeedsAuth = async (): Promise<boolean> => {
  const items = await chrome.storage.local.get(NEEDS_AUTH_KEY);
  return Boolean(items[NEEDS_AUTH_KEY]);
};

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
  const items = await chrome.storage.local.get(STYLES_METADATA_KEY);
  const metadata = items[STYLES_METADATA_KEY];

  if (typeof metadata?.modifiedTime === 'string') {
    return metadata;
  }

  // StylesMetadataUpdate repairs this on startup, but a caller racing it
  // must not be handed something it will dereference into Invalid Date.
  return { modifiedTime: '' };
};
