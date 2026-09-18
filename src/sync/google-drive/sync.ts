import { compareAsc } from 'date-fns';

import {
  StyleMap,
  GoogleDriveSyncMetadata,
  RunGoogleDriveSyncResponse,
} from '@stylebot/types';
import { getCurrentTimestamp } from '@stylebot/utils';

import { toSyncErrorKey, toSyncErrorDetail, isSyncError } from '../errors';
import mergeStyles from './merge-styles';
import getAccessToken, { clearCachedToken } from './get-access-token';
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
import {
  setAll as setAllStyles,
  getAll as getAllStyles,
} from '../../background/styles';

const getStylesBlob = (styles: StyleMap) =>
  new Blob([JSON.stringify(styles)], { type: 'application/json' });

/**
 * Copy local styles to remote and update sync metadata
 */
const writeToRemote = async (
  accessToken: string,
  syncMetadata: GoogleDriveSyncMetadata,
  styles: StyleMap
): Promise<GoogleDriveSyncMetadata> => {
  const blob = getStylesBlob(styles);
  const updatedSyncMetadata = await writeSyncFile(
    accessToken,
    blob,
    syncMetadata.id
  );

  await setGoogleDriveSyncMetadata(updatedSyncMetadata);
  return updatedSyncMetadata;
};

/**
 * Copy remote styles to local and update sync metadata
 */
const writeToLocal = async (
  syncMetadata: GoogleDriveSyncMetadata,
  styles: StyleMap
): Promise<GoogleDriveSyncMetadata> => {
  await setAllStyles(styles);

  const updatedSyncMetadata = {
    ...syncMetadata,
    modifiedTime: getCurrentTimestamp(),
  };

  await setGoogleDriveSyncMetadata(updatedSyncMetadata);
  return updatedSyncMetadata;
};

/**
 * Merge and update both local and remote styles
 */
const merge = async (
  accessToken: string,
  syncMetadata: GoogleDriveSyncMetadata
): Promise<GoogleDriveSyncMetadata> => {
  const localStyles = await getAllStyles();
  const remoteStyles = await downloadSyncFile(accessToken, syncMetadata.id);
  const mergedStyles = mergeStyles(localStyles, remoteStyles);

  await writeToLocal(syncMetadata, mergedStyles);
  return writeToRemote(accessToken, syncMetadata, mergedStyles);
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
const reconcile = async (): Promise<GoogleDriveSyncMetadata> => {
  const styles = await getAllStyles();
  const accessToken = await getAccessToken();
  const remoteSyncMetadata = await getSyncFileMetadata(accessToken);

  console.debug('syncing with google drive...');

  if (!remoteSyncMetadata) {
    console.debug('did not find remote sync file, updating remote...');

    const blob = getStylesBlob(styles);
    const createdSyncMetadata = await writeSyncFile(accessToken, blob);

    await setGoogleDriveSyncMetadata(createdSyncMetadata);
    return createdSyncMetadata;
  }

  const localSyncMetadata = await getGoogleDriveSyncMetadata();

  if (!localSyncMetadata) {
    console.debug('no local sync metadata found. merging local and remote...');
    return merge(accessToken, remoteSyncMetadata);
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

      return merge(accessToken, remoteSyncMetadata);
    }

    console.debug('remote was updated since last sync, updating local...');
    const remoteStyles = await downloadSyncFile(
      accessToken,
      remoteSyncMetadata.id
    );

    return writeToLocal(remoteSyncMetadata, remoteStyles);
  }

  // check if local styles were modified v/s remote
  if (compareAsc(localStylesModifiedTime, remoteSyncTime) > 0) {
    console.debug('local was updated since last sync, updating remote...');
    return writeToRemote(accessToken, remoteSyncMetadata, styles);
  }

  const touchedSyncMetadata = {
    ...remoteSyncMetadata,
    modifiedTime: getCurrentTimestamp(),
  };

  await setGoogleDriveSyncMetadata(touchedSyncMetadata);
  return touchedSyncMetadata;
};

const toFailure = (e: unknown): RunGoogleDriveSyncResponse => {
  console.debug('google drive sync failed', e);

  return {
    ok: false,
    errorKey: toSyncErrorKey(e),
    errorDetail: toSyncErrorDetail(e),
  };
};

/**
 * Never rejects. Callers are message handlers whose sendResponse must always
 * fire, so failures come back as a result rather than an exception.
 */
export const runGoogleDriveSync =
  async (): Promise<RunGoogleDriveSyncResponse> => {
    try {
      return { ok: true, metadata: await reconcile() };
    } catch (e) {
      if (isSyncError(e) && e.code === 'auth') {
        // The cached token may simply have been revoked. Drop it and give the
        // user one chance to re-consent before reporting a failure.
        await clearCachedToken();

        try {
          return { ok: true, metadata: await reconcile() };
        } catch (retryError) {
          return toFailure(retryError);
        }
      }

      return toFailure(e);
    }
  };
