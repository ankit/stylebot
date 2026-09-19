import { GoogleDriveSyncMetadata } from '@stylebot/types';

export const getGoogleDriveSyncMetadata = async (): Promise<
  GoogleDriveSyncMetadata | undefined
> => {
  const items = await chrome.storage.local.get('google-drive-sync');
  return items['google-drive-sync'];
};

export const setGoogleDriveSyncMetadata = (
  googleDriveSyncMetadata: GoogleDriveSyncMetadata
): Promise<void> =>
  chrome.storage.local.set({ 'google-drive-sync': googleDriveSyncMetadata });

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
