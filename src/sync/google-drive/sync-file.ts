import { getCurrentTimestamp } from '@stylebot/utils';
import { GoogleDriveSyncMetadata, StyleMap } from '@stylebot/types';

import { AccessToken } from './get-access-token';

const GOOGLE_DRIVE_FILE_GET_API = `https://www.googleapis.com/drive/v3/files`;
const GOOGLE_DRIVE_FILE_UPLOAD_API = `https://www.googleapis.com/upload/drive/v3/files`;
const GOOGLE_DRIVE_FILE_FIELDS = [
  'id',
  'webViewLink',
  'modifiedTime',
  'webContentLink',
].join(',');

const SYNC_FOLDER_NAME = 'stylebot';
const SYNC_FILE_NAME = 'stylebot_v3_backup.json';

const getAuthorizationHeaders = (accessToken: AccessToken) =>
  new Headers({
    Authorization: `Bearer ${accessToken}`,
  });

export const getFileMetadata = async (
  id: string,
  accessToken: AccessToken
): Promise<GoogleDriveSyncMetadata | null> => {
  const url = `${GOOGLE_DRIVE_FILE_GET_API}/${id}?fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  return await response.json();
};

const createBackupFolder = async (
  accessToken: AccessToken
): Promise<string> => {
  const form = new FormData();
  const metadata = {
    name: SYNC_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthorizationHeaders(accessToken),
    body: form,
  });

  const { id } = await response.json();
  return id;
};

const createBackup = async (
  accessToken: AccessToken,
  blob: Blob,
  folderId: string
): Promise<GoogleDriveSyncMetadata> => {
  const form = new FormData();
  const metadata = {
    name: SYNC_FILE_NAME,
    parents: [folderId],
    mimeType: 'application/json',
    modifiedTime: getCurrentTimestamp(),
  };
  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json',
  });

  form.append('metadata', metadataBlob);
  form.append('file', blob);

  const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthorizationHeaders(accessToken),
    body: form,
  });

  return await response.json();
};

const patchBackup = async (
  id: string,
  accessToken: AccessToken,
  blob: Blob
): Promise<GoogleDriveSyncMetadata> => {
  const form = new FormData();
  const metadata = {
    modifiedTime: getCurrentTimestamp(),
  };
  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json',
  });

  form.append('metadata', metadataBlob);
  form.append('file', blob);

  const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}/${id}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthorizationHeaders(accessToken),
    body: form,
  });

  return await response.json();
};

/**
 * Search for backup JSON on Google Drive and return it's metadata
 * If not found, returns null
 */
export const getSyncFileMetadata = async (
  accessToken: AccessToken
): Promise<GoogleDriveSyncMetadata | null> => {
  const query = `name = '${SYNC_FILE_NAME}'`;
  const url = `${GOOGLE_DRIVE_FILE_GET_API}?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  const { files } = await response.json();
  if (!files || files.length === 0) {
    return null;
  }

  const syncMetadata = await getFileMetadata(files[0].id, accessToken);
  if (!syncMetadata) {
    return null;
  }

  return syncMetadata;
};

/**
 * Download styles JSON from Google Drive
 */
export const downloadSyncFile = async (
  accessToken: string,
  id: string
): Promise<StyleMap> => {
  const url = `${GOOGLE_DRIVE_FILE_GET_API}/${id}?alt=media`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  return await response.json();
};

/**
 * Write to backup JSON on Google Drive
 */
export const writeSyncFile = async (
  accessToken: AccessToken,
  blob: Blob,
  fileId?: string
): Promise<GoogleDriveSyncMetadata> => {
  let syncMetadata;
  if (fileId) {
    syncMetadata = await patchBackup(fileId, accessToken, blob);
  } else {
    const folderId = await createBackupFolder(accessToken);
    syncMetadata = await createBackup(accessToken, blob, folderId);
  }

  return syncMetadata;
};
