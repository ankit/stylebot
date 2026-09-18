jest.mock('../get-access-token', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue('access-token'),
  clearCachedToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../sync-file', () => ({
  getSyncFileMetadata: jest.fn(),
  downloadSyncFile: jest.fn(),
  writeSyncFile: jest.fn(),
}));

import { StyleMap, SyncState } from '@stylebot/types';

import { runGoogleDriveSync } from '../sync';
import {
  getSyncFileMetadata,
  downloadSyncFile,
  writeSyncFile,
} from '../sync-file';

const mockedGetRemote = getSyncFileMetadata as jest.Mock;
const mockedDownload = downloadSyncFile as jest.Mock;
const mockedWrite = writeSyncFile as jest.Mock;

const STATE_KEY = 'google-drive-sync-state';

const remoteMetadata = (modifiedTime: string) => ({
  id: 'file-id',
  modifiedTime,
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
});

const style = (css: string, modifiedTime: string) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime,
});

let store: Record<string, unknown>;

const storedState = () => store[STATE_KEY] as SyncState | undefined;
const storedStyles = () => store['styles'] as StyleMap;

const seed = ({
  enabled = true,
  styles = {},
  localRevision = 'local-1',
  state,
}: {
  enabled?: boolean;
  styles?: StyleMap;
  localRevision?: string;
  state?: SyncState;
}) => {
  store = {
    'google-drive-sync-enabled': enabled,
    styles,
    'styles-metadata': { modifiedTime: localRevision },
    ...(state ? { [STATE_KEY]: state } : {}),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  seed({});

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(
          (
            keys: string | string[],
            callback: (items: Record<string, unknown>) => void
          ) => {
            const names = Array.isArray(keys) ? keys : [keys];
            const items: Record<string, unknown> = {};

            names.forEach(name => {
              // Structured-clone semantics: a caller must not be handed a live
              // reference into the store.
              items[name] = store[name]
                ? JSON.parse(JSON.stringify(store[name]))
                : store[name];
            });

            callback(items);
          }
        ),
        set: jest.fn(
          (items: Record<string, unknown>, callback?: () => void) => {
            Object.assign(store, items);
            callback?.();
          }
        ),
        remove: jest.fn((keys: string[], callback?: () => void) => {
          keys.forEach(key => delete store[key]);
          callback?.();
        }),
      },
    },
    tabs: { query: jest.fn((_q, cb) => cb([])), sendMessage: jest.fn() },
  } as unknown as typeof chrome;
});

describe('runGoogleDriveSync', () => {
  it('refuses to sync when Google Drive sync is disabled', async () => {
    seed({ enabled: false });

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_not_enabled',
      errorDetail: 'Google Drive sync is not enabled',
    });

    expect(mockedGetRemote).not.toBeCalled();
    expect(mockedWrite).not.toBeCalled();
  });

  it('creates the remote file when there is no backup yet', async () => {
    seed({ styles: { 'a.com': style('color: red', '2024-01-01T00:00:00.000Z') } });
    mockedGetRemote.mockResolvedValue(null);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    const response = await runGoogleDriveSync();

    expect(response).toEqual({ ok: true, metadata: remoteMetadata('remote-1') });
    expect(mockedWrite).toBeCalledTimes(1);
    // No file id, so it creates rather than patches.
    expect(mockedWrite.mock.calls[0][2]).toBeUndefined();

    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-1',
      localRevision: 'local-1',
    });
  });

  it('pushes when only local changed', async () => {
    seed({
      localRevision: 'local-2',
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedWrite.mockResolvedValue(remoteMetadata('remote-2'));

    await runGoogleDriveSync();

    expect(mockedWrite).toBeCalledTimes(1);
    expect(mockedDownload).not.toBeCalled();
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-2',
      localRevision: 'local-2',
    });
  });

  it('pulls when only the remote changed, without pushing back', async () => {
    seed({
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue({
      'b.com': style('color: blue', '2024-02-01T00:00:00.000Z'),
    });

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(mockedWrite).not.toBeCalled();
    expect(Object.keys(storedStyles())).toEqual(['b.com']);
  });

  it('merges when both sides changed', async () => {
    seed({
      localRevision: 'local-2',
      styles: { 'a.com': style('color: red', '2024-03-01T00:00:00.000Z') },
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue({
      'b.com': style('color: blue', '2024-02-01T00:00:00.000Z'),
    });
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(mockedWrite).toBeCalledTimes(1);

    const uploaded = mockedWrite.mock.calls[0][1];
    expect(uploaded).toBeInstanceOf(Blob);
    expect(Object.keys(storedStyles()).sort()).toEqual(['a.com', 'b.com']);
  });

  it('writes nothing when neither side changed', async () => {
    seed({
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));

    await runGoogleDriveSync();

    expect(mockedWrite).not.toBeCalled();
    expect(mockedDownload).not.toBeCalled();
  });

  // The bug this replaced: a pull stamped its own timestamp as the sync time
  // while setAll stamped styles-metadata a moment later, so the next run always
  // concluded local was newer and re-uploaded what it had just downloaded.
  it('does not push on the run after a pull', async () => {
    seed({
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue({
      'b.com': style('color: blue', '2024-02-01T00:00:00.000Z'),
    });

    await runGoogleDriveSync();
    expect(mockedWrite).not.toBeCalled();

    await runGoogleDriveSync();
    expect(mockedWrite).not.toBeCalled();
    expect(mockedDownload).toBeCalledTimes(1);
  });

  it('records the local revision read before the upload, not after', async () => {
    seed({
      localRevision: 'local-2',
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedWrite.mockImplementation(async () => {
      // A style saved while the upload was in flight.
      store['styles-metadata'] = { modifiedTime: 'local-3' };
      return remoteMetadata('remote-2');
    });

    await runGoogleDriveSync();

    // local-3 is not yet on the remote, so recording it would strand that edit.
    expect(storedState()?.localRevision).toBe('local-2');
  });

  it('coalesces overlapping runs into one', async () => {
    seed({ state: undefined });
    mockedGetRemote.mockResolvedValue(null);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    const [first, second] = await Promise.all([
      runGoogleDriveSync(),
      runGoogleDriveSync(),
    ]);

    expect(mockedWrite).toBeCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('starts a fresh run once the previous one settled', async () => {
    seed({ state: undefined });
    mockedGetRemote.mockResolvedValue(null);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    await runGoogleDriveSync();
    await runGoogleDriveSync();

    expect(mockedWrite).toBeCalledTimes(2);
  });

  it('reports a failure as a result rather than rejecting', async () => {
    mockedGetRemote.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_network',
      errorDetail: 'Failed to fetch',
    });
  });

  it('leaves local ahead with no state saved when the upload fails, so the next run pushes', async () => {
    seed({
      localRevision: 'local-2',
      styles: { 'a.com': style('color: red', '2024-03-01T00:00:00.000Z') },
      state: {
        remoteRevision: 'remote-1',
        localRevision: 'local-1',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
        metadata: remoteMetadata('remote-1'),
      },
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue({
      'b.com': style('color: blue', '2024-02-01T00:00:00.000Z'),
    });
    mockedWrite.mockRejectedValue(new Error('upload failed'));

    const response = await runGoogleDriveSync();

    expect(response).toMatchObject({ ok: false });
    // The merge was written locally but never recorded as synced.
    expect(Object.keys(storedStyles()).sort()).toEqual(['a.com', 'b.com']);
    expect(storedState()).toMatchObject({ remoteRevision: 'remote-1' });
  });
});
