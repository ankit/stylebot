import { compareAsc, format } from 'date-fns';

import {
  GoogleDriveSyncMetadata,
  StyleMap,
  SetAllStyles,
} from '@stylebot/types';

import mergeStyles from './merge-styles';
import getAccessToken from './get-access-token';

import {
  getGoogleDriveSyncMetadata,
  getLocalStylesMetadata,
  setGoogleDriveSyncMetadata,
} from './sync-metadata';

import {
  getSyncFileMetadata,
  downloadSyncFile,
  writeSyncFile,
} from './sync-file';

const getStylesBlob = (styles: StyleMap) =>
  new Blob([JSON.stringify(styles)], { type: 'application/json' });

const getTimestamp = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

/**
 * Copy local styles to remote and update sync metadata
 */
const writeToRemote = async (
  accessToken: string,
  syncMetadata: GoogleDriveSyncMetadata,
  styles: StyleMap
) => {
  const blob = getStylesBlob(styles);
  const updatedSyncMetadata = await writeSyncFile(
    accessToken,
    blob,
    syncMetadata.id
  );

  return setGoogleDriveSyncMetadata(updatedSyncMetadata);
};

/**
 * Copy remote styles to local and update sync metadata
 */
const writeToLocal = async (
  syncMetadata: GoogleDriveSyncMetadata,
  styles: StyleMap
) => {
  const message: SetAllStyles = {
    name: 'SetAllStyles',
    styles: styles,
  };

  chrome.runtime.sendMessage(message);

  return setGoogleDriveSyncMetadata({
    ...syncMetadata,
    modifiedTime: getTimestamp(),
  });
};

/**
 * Merge and update both local and remote styles
 */
const merge = async (
  accessToken: string,
  syncMetadata: GoogleDriveSyncMetadata,
  styles: StyleMap
) => {
  const remoteStyles = await downloadSyncFile(accessToken, syncMetadata.id);
  const merged = mergeStyles(styles, remoteStyles);

  await writeToLocal(syncMetadata, merged);
  await writeToRemote(accessToken, syncMetadata, merged);
};

/**
 * Run sync on Google Drive. Performs the following checks in order:
 * 1) If no backup is found on drive, write local styles to remote
 * 2) If no local sync metadata is found, merge and update both local and remote styles
 * 3) If the remote sync timestamp > local sync timestamp,
 *    - If local styles' modified timestamp > remote sync timestamp, merge and update both local and remote styles
 *    - Else, write remote styles to local
 * 4) If local styles' modified timestamp > remote sync timestamp, write local styles to remote.
 */
export const runGoogleDriveSync = async (styles: StyleMap): Promise<void> => {
  const accessToken = await getAccessToken();
  const syncMetadata = await getSyncFileMetadata(accessToken);

  console.log('syncing with google drive...', syncMetadata);

  if (!syncMetadata) {
    console.log('did not find remote sync file, updating remote...');

    const blob = getStylesBlob(styles);
    const syncMetadata = await writeSyncFile(accessToken, blob);
    return setGoogleDriveSyncMetadata(syncMetadata);
  }

  const localSyncMetadata = await getGoogleDriveSyncMetadata();

  if (!localSyncMetadata) {
    console.log('no local sync metadata found. merging local and remote...');
    return merge(accessToken, syncMetadata, styles);
  }

  const localStylesMetadata = await getLocalStylesMetadata();

  if (
    compareAsc(
      new Date(syncMetadata.modifiedTime),
      new Date(localSyncMetadata.modifiedTime)
    ) > 0
  ) {
    if (
      compareAsc(
        new Date(localStylesMetadata.modifiedTime),
        new Date(syncMetadata.modifiedTime)
      ) > 0
    ) {
      console.log(
        'both local and remote were updated since last sync, merging local and remote...'
      );
      return merge(accessToken, syncMetadata, styles);
    }

    console.log('remote was updated since last sync, updating local...');
    const remoteStyles = await downloadSyncFile(accessToken, syncMetadata.id);
    return writeToLocal(syncMetadata, remoteStyles);
  }

  if (
    compareAsc(
      new Date(localStylesMetadata.modifiedTime),
      new Date(syncMetadata.modifiedTime)
    ) > 0
  ) {
    console.log('local was updated since last sync, updating remote...');
    return writeToRemote(accessToken, syncMetadata, styles);
  }
};
