import type {
  StyleMap,
  SyncState,
  SyncConflict,
  RunGoogleDriveSyncResponse,
} from '@stylebot/types';
import { getCurrentTimestamp } from '@stylebot/utils';

import {
  syncError,
  isSyncError,
  toSyncErrorKey,
  toSyncErrorDetail,
} from '../errors';
import { mergeThreeWay } from '../merge/three-way';
import { isEquivalentStyleMap } from '@stylebot/styles';
import getAccessToken, { clearCachedToken } from './get-access-token';
import {
  getSyncState,
  setSyncState,
  setSyncNeedsAuth,
  getLocalStylesMetadata,
  getGoogleDriveSyncEnabled,
} from './sync-metadata';
import {
  getSyncFileMetadata,
  getFileMetadata,
  getAccount,
  downloadSyncFile,
  writeSyncFile,
} from './sync-file';
// eslint-disable-next-line stylebot/package-entry-imports -- until the background passes in its style store
import {
  setAllIfUnchanged as setAllStylesIfUnchanged,
  getAll as getAllStyles,
  applyStylesToAllTabs,
} from '../../background/styles';

export type SyncOptions = {
  // Whether an auth window may be opened. Off for scheduled runs, which have
  // no user in front of them.
  interactive: boolean;
};

const getStylesBlob = (styles: StyleMap) =>
  new Blob([JSON.stringify(styles)], { type: 'application/json' });

/**
 * Earlier conflicts stay listed until the user dismisses them; a url that
 * conflicts again just moves to the newer timestamp.
 */
const mergeConflicts = (
  previous: Array<SyncConflict> | undefined,
  urls: Array<string>,
  at: string
): Array<SyncConflict> => [
  ...(previous ?? []).filter(conflict => !urls.includes(conflict.url)),
  ...urls.map(url => ({ url, at })),
];

/**
 * Writes the merged map locally, unless an edit landed since `localRevision`
 * was read — the merge would then be missing it and overwrite it. Returns the
 * revision storage stamped, so the next run compares byte for byte against
 * what it will find, or null when the write was refused.
 */
const writeLocal = async (
  styles: StyleMap,
  localRevision: string
): Promise<string | null> => {
  const revision = await setAllStylesIfUnchanged(styles, localRevision, {
    fromSync: true,
  });

  if (revision !== null) {
    await applyStylesToAllTabs();
  }

  return revision;
};

/**
 * Disconnecting clears the stored state, and a run that started before the
 * click must not put it back: re-enabling would then pick up a record the
 * user asked to be rid of.
 */
const recordSyncState = async (next: SyncState): Promise<void> => {
  if (!(await getGoogleDriveSyncEnabled())) {
    throw syncError(
      'Google Drive sync was disabled during sync',
      'not-enabled'
    );
  }

  await setSyncState(next);
};

/**
 * Run sync on Google Drive:
 * 1) No backup on Drive — write local to remote and record it as the base
 * 2) Neither side changed since the last sync — record the check only
 * 3) Otherwise merge local and remote three ways against the base, write the
 *    result wherever it differs, then record it as the new base
 *
 * Change detection compares the revisions observed at the last sync for
 * equality; ordering two independently-stamped clocks cannot express "these
 * are the same". The base is recorded last, after both writes succeeded: a
 * base behind reality only costs a conflict, one ahead of it loses data.
 */
const reconcile = async (
  { interactive }: SyncOptions,
  retrying = false
): Promise<SyncState> => {
  if (!(await getGoogleDriveSyncEnabled())) {
    throw syncError('Google Drive sync is not enabled', 'not-enabled');
  }

  const now = getCurrentTimestamp();
  const local = await getAllStyles();
  const { modifiedTime: localRevision } = await getLocalStylesMetadata();
  const accessToken = await getAccessToken({ interactive });
  const state = await getSyncState();
  const remote = await getSyncFileMetadata(accessToken);
  // Fetched once; a token always belongs to the account that connected.
  const account =
    state?.account ?? (await getAccount(accessToken)) ?? undefined;

  if (!remote) {
    const metadata = await writeSyncFile(accessToken, getStylesBlob(local));
    const next: SyncState = {
      metadata,
      remoteRevision: metadata.modifiedTime,
      localRevision,
      lastSyncedAt: now,
      baseStyles: local,
      conflicts: state?.conflicts,
      account,
    };

    await recordSyncState(next);
    return next;
  }

  const remoteChanged = state?.remoteRevision !== remote.modifiedTime;
  const localChanged = state?.localRevision !== localRevision;

  if (state && !remoteChanged && !localChanged) {
    // Both sides still hold what they held at the last sync, so local is the
    // base — which also backfills it for profiles that synced before it was
    // recorded, without having to merge blind.
    const next: SyncState = {
      ...state,
      metadata: remote,
      lastSyncedAt: now,
      baseStyles: state.baseStyles ?? local,
      account,
    };

    await recordSyncState(next);
    return next;
  }

  // An unchanged remote is, by definition, still the base — no download needed.
  const base = state?.baseStyles;
  const remoteStyles =
    !remoteChanged && base
      ? base
      : await downloadSyncFile(accessToken, remote.id);

  const { styles, conflicts } = mergeThreeWay(base, local, remoteStyles, now);

  let metadata = remote;
  let nextLocalRevision = localRevision;

  // A side that differs only in timestamps or whitespace is left as it is.
  const shouldUpdateRemote = !isEquivalentStyleMap(styles, remoteStyles);
  const shouldUpdateLocal = !isEquivalentStyleMap(styles, local);

  if (shouldUpdateRemote) {
    // Another device may have uploaded since the metadata was read. Merging
    // over its copy would drop its edits, so start over from a fresh read —
    // once. A second collision in a row is left for the next run.
    const latest = await getFileMetadata(remote.id, accessToken);

    if (latest && latest.modifiedTime !== remote.modifiedTime) {
      if (retrying) {
        throw syncError('Drive file changed during sync', 'unknown');
      }

      return reconcile({ interactive }, true);
    }
  }

  if (shouldUpdateLocal) {
    const written = await writeLocal(styles, localRevision);

    // Same story as the remote: an edit saved while this ran is not in the
    // merge, so start over from a fresh read of local — once.
    if (written === null) {
      if (retrying) {
        throw syncError('Styles changed during sync', 'unknown');
      }

      return reconcile({ interactive }, true);
    }

    nextLocalRevision = written;
  }

  if (shouldUpdateRemote) {
    metadata = await writeSyncFile(
      accessToken,
      getStylesBlob(styles),
      remote.id
    );
  }

  const next: SyncState = {
    metadata,
    remoteRevision: metadata.modifiedTime,
    localRevision: nextLocalRevision,
    lastSyncedAt: now,
    // The base is kept byte for byte what Drive holds, so an unchanged remote
    // can keep standing in for a download.
    baseStyles: shouldUpdateRemote ? styles : remoteStyles,
    // Re-read rather than reuse `state`: a conflict dismissed from the Sync
    // tab while this ran must not come back.
    conflicts: mergeConflicts(
      (await getSyncState())?.conflicts,
      conflicts,
      now
    ),
    account,
  };

  await recordSyncState(next);
  return next;
};

// One service worker, so module scope is the right scope for this. Overlapping
// runs coalesce rather than reject, so a popup "Sync Now" during an
// options-page run just awaits the same result.
let inFlight: Promise<RunGoogleDriveSyncResponse> | null = null;

const toFailure = (e: unknown): RunGoogleDriveSyncResponse => ({
  ok: false,
  errorKey: toSyncErrorKey(e),
  errorDetail: toSyncErrorDetail(e),
});

const run = async (
  options: SyncOptions
): Promise<RunGoogleDriveSyncResponse> => {
  try {
    const { metadata } = await reconcile(options);
    await setSyncNeedsAuth(false);

    return { ok: true, metadata };
  } catch (e) {
    if (isSyncError(e) && e.code === 'auth') {
      // The cached token may simply have been revoked. Drop it and give the
      // user one chance to re-consent before reporting a failure.
      await clearCachedToken();

      try {
        const { metadata } = await reconcile(options);
        await setSyncNeedsAuth(false);

        return { ok: true, metadata };
      } catch (retryError) {
        if (
          !options.interactive &&
          isSyncError(retryError) &&
          retryError.code === 'auth'
        ) {
          // A scheduled run has nobody to show an auth window to. Leave a
          // flag for the UI and let the next manual sync do the sign-in.
          await setSyncNeedsAuth(true);
        }

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
export const runGoogleDriveSync = (
  options: SyncOptions = { interactive: true }
): Promise<RunGoogleDriveSyncResponse> => {
  // Not .finally(): tsconfig sets no target, so ES3 output has no
  // Promise.prototype.finally.
  inFlight =
    inFlight ??
    run(options).then(
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
