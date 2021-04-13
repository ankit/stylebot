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

export const getLocalStylesMetadata = (): Promise<{ modifiedTime: string }> =>
  new Promise(resolve => {
    chrome.storage.local.get('styles-metadata', async items => {
      resolve(items['styles-metadata']);
    });
  });
