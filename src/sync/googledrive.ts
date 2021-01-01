import { GoogleDriveSyncMetadata, StyleMap } from '@stylebot/types';

type AccessToken = string;

const getGoogleDriveSyncMetadata = (): Promise<
  GoogleDriveSyncMetadata | undefined
> =>
  new Promise(resolve => {
    chrome.storage.local.get('google-drive-sync', async items => {
      resolve(items['google-drive-sync']);
    });
  });

const setGoogleDriveSyncMetadata = (
  googleDriveSyncMetadata: GoogleDriveSyncMetadata
): void => {
  chrome.storage.local.set({ 'google-drive-sync': googleDriveSyncMetadata });
};

const getOAuthAccessToken = (): Promise<AccessToken> =>
  new Promise<AccessToken>(resolve => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      resolve(token);
    });
  });

const getGoogleDriveSyncFile = (
  accessToken: AccessToken
): Promise<GoogleDriveSyncMetadata | null> =>
  new Promise<GoogleDriveSyncMetadata | null>(async resolve => {
    const googleDriveSyncMetadata = await getGoogleDriveSyncMetadata();

    if (!googleDriveSyncMetadata) {
      return resolve(null);
    }

    fetch(
      `https://www.googleapis.com/drive/v3/files/${googleDriveSyncMetadata.id}?fields=id,modifiedTime`,
      {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
        }),
      }
    )
      .then(response => response.json())
      .then(val => resolve(val));
  });

const writeGoogleDriveSyncFile = (
  accessToken: AccessToken,
  styles: StyleMap
): Promise<GoogleDriveSyncMetadata> =>
  new Promise<GoogleDriveSyncMetadata>(resolve => {
    const json = JSON.stringify(styles);
    const file = new Blob([json], { type: 'application/json' });

    const form = new FormData();
    const metadata = {
      name: 'stylebot_backup.json',
      mimeType: 'application/json',
    };

    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );

    form.append('file', file);

    fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime',
      {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
        }),
        body: form,
      }
    )
      .then(response => response.json())
      .then(({ id, modifiedTime }) => {
        resolve({ id, modifiedTime });
      });
  });

export const runGoogleDriveSync = async (styles: StyleMap): Promise<void> => {
  console.log('running google drive sync...');
  const accessToken = await getOAuthAccessToken();
  const googleDriveSyncFile = await getGoogleDriveSyncFile(accessToken);

  console.log('syncing with google drive...');
  if (!googleDriveSyncFile) {
    const { id, modifiedTime } = await writeGoogleDriveSyncFile(
      accessToken,
      styles
    );

    console.log(id, modifiedTime);
    setGoogleDriveSyncMetadata({ id, modifiedTime });
  } else {
    console.log('updating existing sync file...');
    const { id, modifiedTime } = googleDriveSyncFile;
    setGoogleDriveSyncMetadata({ id, modifiedTime });
    console.log(id, modifiedTime);
  }
};

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
