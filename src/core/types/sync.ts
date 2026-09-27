import type { Timestamp } from './shared';
import type { StyleMap } from './styles';

export type GoogleDriveSyncMetadata = {
  id: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
};

export type SyncConflict = {
  url: string;
  at: Timestamp;
};

export type SyncAccount = {
  email: string;
};

/**
 * What the last successful sync observed. remoteRevision is Drive's
 * modifiedTime for the file and localRevision the styles-metadata stamp;
 * both are opaque strings compared for equality only — never ordered — so
 * that a clock on one machine is never measured against a clock on another.
 * baseStyles is the map both sides agreed on at that point, which is what
 * lets the next merge tell a deletion from an addition; it is absent on
 * profiles that synced before it was recorded.
 */
export type SyncState = {
  remoteRevision: string;
  localRevision: string;
  lastSyncedAt: Timestamp;
  metadata: GoogleDriveSyncMetadata;
  baseStyles?: StyleMap;
  conflicts?: Array<SyncConflict>;
  account?: SyncAccount;
};
