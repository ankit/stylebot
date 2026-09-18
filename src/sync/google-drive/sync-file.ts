import { compareAsc } from 'date-fns';

import { getCurrentTimestamp } from '@stylebot/utils';
import { GoogleDriveSyncMetadata, StyleMap } from '@stylebot/types';

import { syncError } from '../errors';
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
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const searchFiles = async (
  query: string,
  accessToken: AccessToken,
  fields: string
): Promise<Array<{ id: string; modifiedTime?: string }>> => {
  const params = new URLSearchParams({
    q: query,
    spaces: 'drive',
    fields: `files(${fields})`,
  });

  const response = await fetch(`${GOOGLE_DRIVE_FILE_GET_API}?${params}`, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  const { files } = await parseJsonResponse<{
    files?: Array<{ id: string; modifiedTime?: string }>;
  }>(response);

  return files ?? [];
};

const getAuthorizationHeaders = (accessToken: AccessToken) =>
  new Headers({
    Authorization: `Bearer ${accessToken}`,
  });

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw syncError(
      `Google Drive API request failed (${response.status} ${response.statusText})`,
      response.status === 401 || response.status === 403 ? 'auth' : 'unknown'
    );
  }

  try {
    return await response.json();
  } catch {
    throw syncError('Google Drive returned invalid JSON', 'parse');
  }
};

/**
 * The file is the user's, so it can hold anything by the time it is read
 * back: a hand edit in Drive, or an empty body. Only a map of style objects
 * may reach the merge.
 */
const isStyleMap = (value: unknown): value is StyleMap =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every(
    style =>
      typeof style === 'object' &&
      style !== null &&
      typeof (style as { css?: unknown }).css === 'string'
  );

export const getFileMetadata = async (
  id: string,
  accessToken: AccessToken
): Promise<GoogleDriveSyncMetadata | null> => {
  const url = `${GOOGLE_DRIVE_FILE_GET_API}/${id}?fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  return parseJsonResponse<GoogleDriveSyncMetadata | null>(response);
};

const getBackupFolderId = async (
  accessToken: AccessToken
): Promise<string | null> => {
  const query = `name = '${SYNC_FOLDER_NAME}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;
  const folders = await searchFiles(query, accessToken, 'id');

  return folders[0]?.id ?? null;
};

/**
 * A folder has no content, so it is created through files.create as JSON
 * rather than the multipart upload endpoint.
 */
const createBackupFolder = async (
  accessToken: AccessToken
): Promise<string> => {
  const headers = getAuthorizationHeaders(accessToken);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${GOOGLE_DRIVE_FILE_GET_API}?fields=id`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: SYNC_FOLDER_NAME,
      mimeType: FOLDER_MIME_TYPE,
    }),
  });

  const { id } = await parseJsonResponse<{ id: string }>(response);
  return id;
};

/**
 * Creating unconditionally left a duplicate `stylebot` folder behind every
 * time the sync file had to be re-created.
 */
const getOrCreateBackupFolder = async (
  accessToken: AccessToken
): Promise<string> =>
  (await getBackupFolderId(accessToken)) ?? createBackupFolder(accessToken);

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

  return parseJsonResponse<GoogleDriveSyncMetadata>(response);
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

  return parseJsonResponse<GoogleDriveSyncMetadata>(response);
};

/**
 * Search for backup JSON on Google Drive and return it's metadata
 * If not found, returns null
 */
export const getSyncFileMetadata = async (
  accessToken: AccessToken
): Promise<GoogleDriveSyncMetadata | null> => {
  const folderId = await getBackupFolderId(accessToken);

  // Without a folder there is nothing of ours to find, so skip the file search.
  if (!folderId) {
    return null;
  }

  // Scoped to our own folder and to untrashed files: an unscoped name search
  // would happily return a deleted copy, or an unrelated file of the same name
  // elsewhere in the user's Drive.
  const query = `name = '${SYNC_FILE_NAME}' and '${folderId}' in parents and trashed = false`;
  const files = await searchFiles(query, accessToken, 'id,modifiedTime');

  if (files.length === 0) {
    return null;
  }

  const newest = files.reduce((latest, file) =>
    compareAsc(
      new Date(file.modifiedTime ?? 0),
      new Date(latest.modifiedTime ?? 0)
    ) > 0
      ? file
      : latest
  );

  return getFileMetadata(newest.id, accessToken);
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

  const styles = await parseJsonResponse<unknown>(response);

  if (!isStyleMap(styles)) {
    throw syncError('The synced file is not a map of styles', 'parse');
  }

  return styles;
};

/**
 * Write to backup JSON on Google Drive
 */
export const writeSyncFile = async (
  accessToken: AccessToken,
  blob: Blob,
  fileId?: string
): Promise<GoogleDriveSyncMetadata> => {
  if (fileId) {
    return patchBackup(fileId, accessToken, blob);
  }

  const folderId = await getOrCreateBackupFolder(accessToken);
  return createBackup(accessToken, blob, folderId);
};
