import {
  StyleMap,
  SyncState,
  GoogleDriveSyncMetadata,
  RunGoogleDriveSyncResponse,
} from '@stylebot/types';
import { getCurrentTimestamp } from '@stylebot/utils';

import {
  syncError,
  isSyncError,
  toSyncErrorKey,
  toSyncErrorDetail,
} from '../errors';
import { mergeWithoutBase as mergeStyles } from '../merge/merge-without-base';
import getAccessToken, { clearCachedToken } from './get-access-token';
import {
  getSyncState,
  setSyncState,
  getLocalStylesMetadata,
  getGoogleDriveSyncEnabled,
} from './sync-metadata';
import {
  getSyncFileMetadata,
  downloadSyncFile,
  writeSyncFile,
} from './sync-file';
import {
  setAll as setAllStyles,
  getAll as getAllStyles,
  applyStylesToAllTabs,
} from '../../background/styles';

const getStylesBlob = (styles: StyleMap) =>
  new Blob([JSON.stringify(styles)], { type: 'application/json' });

const toState = (
  metadata: GoogleDriveSyncMetadata,
  localRevision: string
): SyncState => ({
  metadata,
  remoteRevision: metadata.modifiedTime,
  localRevision,
  lastSyncedAt: getCurrentTimestamp(),
});

/**
 * Copy local styles to remote. localRevision is the caller's pre-upload
 * reading, never a fresh one: an edit landing mid-upload must not be recorded
 * as synced, or it would never be pushed.
 */
const push = async (
  accessToken: string,
  styles: StyleMap,
  metadata: GoogleDriveSyncMetadata | null,
  localRevision: string
): Promise<SyncState> => {
  const updated = await writeSyncFile(
    accessToken,
    getStylesBlob(styles),
    metadata?.id
  );

  const state = toState(updated, localRevision);
  await setSyncState(state);

  return state;
};

/**
 * Copy remote styles to local. The stored localRevision is read back out of
 * storage rather than stamped here, so it matches byte for byte what the next
 * run will compare against.
 */
const pull = async (
  metadata: GoogleDriveSyncMetadata,
  styles: StyleMap
): Promise<SyncState> => {
  await setAllStyles(styles);
  await applyStylesToAllTabs();

  const { modifiedTime } = await getLocalStylesMetadata();
  const state = toState(metadata, modifiedTime);
  await setSyncState(state);

  return state;
};

/**
 * Merge both sides. Local is written before the upload, so a failed upload
 * leaves local ahead with no state saved — the next run then sees a local-only
 * change and pushes, recovering on its own.
 */
const mergeBoth = async (
  accessToken: string,
  metadata: GoogleDriveSyncMetadata,
  localStyles: StyleMap
): Promise<SyncState> => {
  const remoteStyles = await downloadSyncFile(accessToken, metadata.id);
  const merged = mergeStyles(localStyles, remoteStyles);

  await setAllStyles(merged);
  await applyStylesToAllTabs();
  const { modifiedTime } = await getLocalStylesMetadata();

  return push(accessToken, merged, metadata, modifiedTime);
};

/**
 * Run sync on Google Drive:
 * 1) No backup on Drive, or no record of a previous sync — write local to remote
 * 2) Both sides changed since the last sync — merge, then write both
 * 3) Only the remote changed — write remote to local
 * 4) Only local changed — write local to remote
 * 5) Neither changed — record the check and touch nothing
 *
 * Change detection compares the revisions observed at the last sync for
 * equality. Ordering two independently-stamped clocks cannot express "these
 * are the same", which is why every pull used to be followed by a pointless
 * re-upload of what had just been downloaded.
 */
const reconcile = async (): Promise<SyncState> => {
  if (!(await getGoogleDriveSyncEnabled())) {
    throw syncError('Google Drive sync is not enabled', 'not-enabled');
  }

  const styles = await getAllStyles();
  const { modifiedTime: localRevision } = await getLocalStylesMetadata();
  const accessToken = await getAccessToken();
  const state = await getSyncState();
  const remote = await getSyncFileMetadata(accessToken);

  if (!remote) {
    console.debug('did not find remote sync file, updating remote...');
    return push(accessToken, styles, null, localRevision);
  }

  const remoteChanged = state?.remoteRevision !== remote.modifiedTime;
  const localChanged = state?.localRevision !== localRevision;

  console.debug('sync info', { state, remote, remoteChanged, localChanged });

  if (remoteChanged && localChanged) {
    console.debug('both sides changed since last sync, merging...');
    return mergeBoth(accessToken, remote, styles);
  }

  if (remoteChanged) {
    console.debug('remote changed since last sync, updating local...');
    const remoteStyles = await downloadSyncFile(accessToken, remote.id);
    return pull(remote, remoteStyles);
  }

  if (localChanged) {
    console.debug('local changed since last sync, updating remote...');
    return push(accessToken, styles, remote, localRevision);
  }

  // Neither side changed, so both revisions still hold; only record that the
  // check happened. Reconstructed rather than spread from `state` because the
  // branches above already established it is defined.
  console.debug('nothing changed since last sync');

  const touched: SyncState = {
    metadata: remote,
    remoteRevision: remote.modifiedTime,
    localRevision: localRevision,
    lastSyncedAt: getCurrentTimestamp(),
  };

  await setSyncState(touched);

  return touched;
};

// One service worker, so module scope is the right scope for this. Overlapping
// runs coalesce rather than reject, so a popup "Sync Now" during an
// options-page run just awaits the same result.
let inFlight: Promise<RunGoogleDriveSyncResponse> | null = null;

const toFailure = (e: unknown): RunGoogleDriveSyncResponse => {
  console.debug('google drive sync failed', e);

  return {
    ok: false,
    errorKey: toSyncErrorKey(e),
    errorDetail: toSyncErrorDetail(e),
  };
};

const run = async (): Promise<RunGoogleDriveSyncResponse> => {
  try {
    return { ok: true, metadata: (await reconcile()).metadata };
  } catch (e) {
    if (isSyncError(e) && e.code === 'auth') {
      // The cached token may simply have been revoked. Drop it and give the
      // user one chance to re-consent before reporting a failure.
      await clearCachedToken();

      try {
        return { ok: true, metadata: (await reconcile()).metadata };
      } catch (retryError) {
        return toFailure(retryError);
      }
    }

    return toFailure(e);
  }
};

/**
 * Never rejects. Callers are message handlers whose sendResponse must always
 * fire, so failures come back as a result rather than an exception.
 */
export const runGoogleDriveSync = (): Promise<RunGoogleDriveSyncResponse> => {
  // Not .finally(): tsconfig sets no target, so ES3 output has no
  // Promise.prototype.finally.
  inFlight =
    inFlight ??
    run().then(
      response => {
        inFlight = null;
        return response;
      },
      e => {
        inFlight = null;
        throw e;
      }
    );

  return inFlight;
};
