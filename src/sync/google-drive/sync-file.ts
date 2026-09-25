import { compareAsc } from 'date-fns';

import type {
  GoogleDriveSyncMetadata,
  StyleMap,
  SyncAccount,
} from '@stylebot/types';

import { syncError } from '../errors';
import type { AccessToken } from './get-access-token';
import { getAuthorizationHeaders, parseJsonResponse } from './http';
import { isStyleMap } from './style-map';
import { SYNC_FOLDER_NAME, SYNC_FILE_NAME } from './constants';

const GOOGLE_DRIVE_FILE_GET_API = `https://www.googleapis.com/drive/v3/files`;
const GOOGLE_DRIVE_ABOUT_API = `https://www.googleapis.com/drive/v3/about`;
const GOOGLE_DRIVE_FILE_UPLOAD_API = `https://www.googleapis.com/upload/drive/v3/files`;
const GOOGLE_DRIVE_FILE_FIELDS = [
  'id',
  'webViewLink',
  'modifiedTime',
  'webContentLink',
].join(',');

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

/**
 * Which Google account the token belongs to, so the Sync tab can say where
 * the backup lives. Null when Drive will not say; the tab then just omits it.
 */
export const getAccount = async (
  accessToken: AccessToken
): Promise<SyncAccount | null> => {
  const url = `${GOOGLE_DRIVE_ABOUT_API}?fields=user(emailAddress)`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthorizationHeaders(accessToken),
  });

  if (!response.ok) {
    return null;
  }

  const { user } = await response.json();
  return user?.emailAddress ? { email: user.emailAddress } : null;
};

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
  // modifiedTime is deliberately left to Drive. The sync algorithm treats it
  // as the server's revision marker, so stamping it from this machine's clock
  // would make two machines disagree about which copy is current.
  const metadata = {
    name: SYNC_FILE_NAME,
    parents: [folderId],
    mimeType: 'application/json',
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

  // Empty metadata, for the reason given in createBackup. A media upload
  // always creates a new Drive revision, so modifiedTime still moves.
  const metadataBlob = new Blob([JSON.stringify({})], {
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
