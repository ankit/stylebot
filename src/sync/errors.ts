import { SyncErrorKey } from '@stylebot/types';

export type SyncErrorCode =
  | 'auth'
  | 'network'
  | 'not-found'
  | 'parse'
  | 'not-enabled'
  | 'unknown';

export type SyncError = Error & { code: SyncErrorCode };

/**
 * A factory rather than an Error subclass: tsconfig sets no `target`, so
 * TypeScript emits ES3 and `class extends Error` silently breaks instanceof.
 */
export const syncError = (message: string, code: SyncErrorCode): SyncError =>
  Object.assign(new Error(message), { code });

export const isSyncError = (e: unknown): e is SyncError =>
  e instanceof Error && typeof (e as SyncError).code === 'string';

const ERROR_KEYS: Record<SyncErrorCode, SyncErrorKey> = {
  auth: 'sync_error_auth',
  network: 'sync_error_network',
  'not-found': 'sync_error_not_found',
  parse: 'sync_error_parse',
  'not-enabled': 'sync_error_not_enabled',
  unknown: 'sync_error_unknown',
};

export const toSyncErrorKey = (e: unknown): SyncErrorKey => {
  if (isSyncError(e)) {
    return ERROR_KEYS[e.code] ?? 'sync_error_unknown';
  }

  // fetch rejects with a bare TypeError when the request never left the device.
  if (e instanceof TypeError) {
    return 'sync_error_network';
  }

  return 'sync_error_unknown';
};

export const toSyncErrorDetail = (e: unknown): string | undefined => {
  if (e instanceof Error) {
    return e.message;
  }

  return typeof e === 'string' ? e : undefined;
};
