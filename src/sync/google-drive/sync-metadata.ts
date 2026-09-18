import { GoogleDriveSyncMetadata } from '@stylebot/types';

export const getGoogleDriveSyncMetadata = (): Promise<
  GoogleDriveSyncMetadata | undefined
> =>
  new Promise(resolve => {
    chrome.storage.local.get('google-drive-sync', async items => {
      resolve(items['google-drive-sync']);
    });
  });

export const setGoogleDriveSyncMetadata = (
  googleDriveSyncMetadata: GoogleDriveSyncMetadata
): Promise<void> =>
  new Promise<void>(resolve => {
    chrome.storage.local.set(
      { 'google-drive-sync': googleDriveSyncMetadata },
      () => {
        resolve();
      }
    );
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

/* Sorts before any real timestamp, so styles with no recorded modified time
   never look newer than the remote copy and never trigger an upload. */
const NEVER_MODIFIED = new Date(0).toISOString();

export const getLocalStylesMetadata = (): Promise<{ modifiedTime: string }> =>
  new Promise(resolve => {
    chrome.storage.local.get('styles-metadata', items => {
      const stylesMetadata = items['styles-metadata'];

      if (typeof stylesMetadata?.modifiedTime === 'string') {
        resolve({ modifiedTime: stylesMetadata.modifiedTime });
      } else if (typeof stylesMetadata === 'string') {
        resolve({ modifiedTime: stylesMetadata });
      } else {
        resolve({ modifiedTime: NEVER_MODIFIED });
      }
    });
  });
