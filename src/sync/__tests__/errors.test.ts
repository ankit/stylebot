import {
  syncError,
  isSyncError,
  toSyncErrorKey,
  toSyncErrorDetail,
} from '../errors';

describe('syncError', () => {
  it('produces a real Error, so instanceof works under the ES3 target', () => {
    const error = syncError('Authorization failure', 'auth');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Authorization failure');
    expect(error.code).toBe('auth');
  });

  it('is recognised by isSyncError', () => {
    expect(isSyncError(syncError('nope', 'auth'))).toBe(true);
    expect(isSyncError(new Error('plain'))).toBe(false);
    expect(isSyncError('Authorization failure')).toBe(false);
  });
});

describe('toSyncErrorKey', () => {
  it('maps each sync error code to its locale key', () => {
    expect(toSyncErrorKey(syncError('', 'auth'))).toBe('sync_error_auth');
    expect(toSyncErrorKey(syncError('', 'network'))).toBe('sync_error_network');
    expect(toSyncErrorKey(syncError('', 'not-found'))).toBe(
      'sync_error_not_found'
    );
    expect(toSyncErrorKey(syncError('', 'parse'))).toBe('sync_error_parse');
    expect(toSyncErrorKey(syncError('', 'not-enabled'))).toBe(
      'sync_error_not_enabled'
    );
  });

  it('treats a bare TypeError as a network failure, which is how fetch rejects', () => {
    expect(toSyncErrorKey(new TypeError('Failed to fetch'))).toBe(
      'sync_error_network'
    );
  });

  it('falls back to the unknown key for anything else', () => {
    expect(toSyncErrorKey(new Error('boom'))).toBe('sync_error_unknown');
    expect(toSyncErrorKey('Authorization failure')).toBe('sync_error_unknown');
    expect(toSyncErrorKey(undefined)).toBe('sync_error_unknown');
  });
});

describe('toSyncErrorDetail', () => {
  it('uses the error message', () => {
    expect(toSyncErrorDetail(new Error('boom'))).toBe('boom');
  });

  it('passes a thrown string through', () => {
    expect(toSyncErrorDetail('Authorization failure')).toBe(
      'Authorization failure'
    );
  });

  it('returns undefined for a value with no message', () => {
    expect(toSyncErrorDetail({ nope: true })).toBeUndefined();
  });
});
