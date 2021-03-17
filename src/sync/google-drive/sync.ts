import { compareAsc } from 'date-fns';

import { StyleMap, GoogleDriveSyncMetadata } from '@stylebot/types';
import { getCurrentTimestamp } from '@stylebot/utils';

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
import BackgroundPageStyles from 'background/styles';

const getStylesBlob = (styles: StyleMap) =>
  new Blob([JSON.stringify(styles)], { type: 'application/json' });

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
  styles: StyleMap,
  backgroundPageStyles: BackgroundPageStyles
) => {
  backgroundPageStyles.setAll(styles, false);

  return setGoogleDriveSyncMetadata({
    ...syncMetadata,
    modifiedTime: getCurrentTimestamp(),
  });
};

/**
 * Merge and update both local and remote styles
 */
const merge = async (
  accessToken: string,
  syncMetadata: GoogleDriveSyncMetadata,
  backgroundPageStyles: BackgroundPageStyles
) => {
  const localStyles = backgroundPageStyles.getAll();
  const remoteStyles = await downloadSyncFile(accessToken, syncMetadata.id);
  const mergedStyles = mergeStyles(localStyles, remoteStyles);

  await writeToLocal(syncMetadata, mergedStyles, backgroundPageStyles);
  await writeToRemote(accessToken, syncMetadata, mergedStyles);
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
export const runGoogleDriveSync = async (
  backgroundPageStyles: BackgroundPageStyles
): Promise<void> => {
  const accessToken = await getAccessToken();
  const remoteSyncMetadata = await getSyncFileMetadata(accessToken);

  console.debug('syncing with google drive...');

  if (!remoteSyncMetadata) {
    console.debug('did not find remote sync file, updating remote...');

    const blob = getStylesBlob(backgroundPageStyles.getAll());
    const remoteSyncMetadata = await writeSyncFile(accessToken, blob);
    return setGoogleDriveSyncMetadata(remoteSyncMetadata);
  }

  const localSyncMetadata = await getGoogleDriveSyncMetadata();

  if (!localSyncMetadata) {
    console.debug('no local sync metadata found. merging local and remote...');
    return merge(accessToken, remoteSyncMetadata, backgroundPageStyles);
  }

  const localStylesMetadata = await getLocalStylesMetadata();

  const localSyncTime = new Date(localSyncMetadata.modifiedTime);
  const remoteSyncTime = new Date(remoteSyncMetadata.modifiedTime);
  const localStylesModifiedTime = new Date(localStylesMetadata.modifiedTime);

  console.debug('sync info', {
    localSyncTime,
    remoteSyncTime,
    localStylesModifiedTime,
  });

  // check if the remote is newer v/s local
  if (compareAsc(remoteSyncTime, localSyncTime) > 0) {
    // check if local styles were modified v/s remote
    if (compareAsc(localStylesModifiedTime, remoteSyncTime) > 0) {
      console.debug(
        'both local and remote were updated since last sync, merging local and remote...'
      );

      return merge(accessToken, remoteSyncMetadata, backgroundPageStyles);
    }

    console.debug('remote was updated since last sync, updating local...');
    const remoteStyles = await downloadSyncFile(
      accessToken,
      remoteSyncMetadata.id
    );

    return writeToLocal(remoteSyncMetadata, remoteStyles, backgroundPageStyles);
  }

  // check if local styles were modified v/s remote
  if (compareAsc(localStylesModifiedTime, remoteSyncTime) > 0) {
    console.debug('local was updated since last sync, updating remote...');
    return writeToRemote(
      accessToken,
      remoteSyncMetadata,
      backgroundPageStyles.getAll()
    );
  }

  return setGoogleDriveSyncMetadata({
    ...remoteSyncMetadata,
    modifiedTime: getCurrentTimestamp(),
  });
};
