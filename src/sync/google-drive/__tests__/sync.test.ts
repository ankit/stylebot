jest.mock('../get-access-token', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue('access-token'),
  clearCachedToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../sync-file', () => ({
  getSyncFileMetadata: jest.fn(),
  getFileMetadata: jest.fn(),
  downloadSyncFile: jest.fn(),
  writeSyncFile: jest.fn(),
}));

import { StyleMap, SyncState } from '@stylebot/types';

import { runGoogleDriveSync } from '../sync';
import {
  getSyncFileMetadata,
  getFileMetadata,
  downloadSyncFile,
  writeSyncFile,
} from '../sync-file';

const mockedGetRemote = getSyncFileMetadata as jest.Mock;
const mockedGetFile = getFileMetadata as jest.Mock;
const mockedDownload = downloadSyncFile as jest.Mock;
const mockedWrite = writeSyncFile as jest.Mock;

const STATE_KEY = 'google-drive-sync-state';

const remoteMetadata = (modifiedTime: string) => ({
  id: 'file-id',
  modifiedTime,
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
});

const style = (css: string, modifiedTime = '2024-01-01T00:00:00.000Z') => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime,
});

const RED = { 'a.com': style('a { color: red; }') };
const BLUE = {
  'a.com': style('a { color: blue; }', '2024-02-01T00:00:00.000Z'),
};
const GREEN = { 'b.com': style('b { color: green; }') };

const synced = (
  remoteRevision: string,
  localRevision: string,
  baseStyles?: StyleMap,
  extra: Partial<SyncState> = {}
): SyncState => ({
  remoteRevision,
  localRevision,
  lastSyncedAt: '2024-01-01T00:00:00.000Z',
  metadata: remoteMetadata(remoteRevision),
  ...(baseStyles ? { baseStyles } : {}),
  ...extra,
});

let store: Record<string, unknown>;

const storedState = () => store[STATE_KEY] as SyncState | undefined;
const storedStyles = () => store['styles'] as StyleMap;
const uploadedStyles = (call = 0): StyleMap => {
  const blob = mockedWrite.mock.calls[call][1] as Blob;
  return JSON.parse((blob as unknown as { parts: Array<string> }).parts[0]);
};

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

  // Unless a test says otherwise the file has not moved between the search
  // and the pre-upload check.
  mockedGetFile.mockImplementation(() => mockedGetRemote());

  // jsdom's Blob keeps no readable text; stub one that does.
  global.Blob = class {
    parts: Array<string>;
    type: string;
    constructor(parts: Array<string>, options: { type: string }) {
      this.parts = parts;
      this.type = options.type;
    }
  } as unknown as typeof Blob;

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: string | Array<string>) => {
          const names = Array.isArray(keys) ? keys : [keys];
          const items: Record<string, unknown> = {};

          names.forEach(name => {
            // Structured-clone semantics: a caller must not be handed a live
            // reference into the store.
            items[name] = store[name]
              ? JSON.parse(JSON.stringify(store[name]))
              : store[name];
          });

          return items;
        }),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (keys: Array<string>) => {
          keys.forEach(key => delete store[key]);
        }),
      },
    },
    tabs: { query: jest.fn(async () => []), sendMessage: jest.fn() },
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

  it('does not write state back after the user disconnected mid-run', async () => {
    seed({ styles: RED });
    mockedGetRemote.mockImplementation(async () => {
      // Disconnect clears the flag and the stored state while Drive is slow.
      store['google-drive-sync-enabled'] = false;
      delete store[STATE_KEY];
      return null;
    });
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    const response = await runGoogleDriveSync();

    expect(response.ok).toBe(false);
    expect(storedState()).toBeUndefined();
  });

  it('creates the remote file when there is no backup yet', async () => {
    seed({ styles: RED });
    mockedGetRemote.mockResolvedValue(null);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    const response = await runGoogleDriveSync();

    expect(response).toEqual({
      ok: true,
      metadata: remoteMetadata('remote-1'),
    });
    expect(mockedWrite).toBeCalledTimes(1);
    // No file id, so it creates rather than patches.
    expect(mockedWrite.mock.calls[0][2]).toBeUndefined();

    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-1',
      localRevision: 'local-1',
      baseStyles: RED,
    });
  });

  it('pushes when only local changed, without downloading', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedWrite.mockResolvedValue(remoteMetadata('remote-2'));

    await runGoogleDriveSync();

    expect(mockedWrite).toBeCalledTimes(1);
    expect(uploadedStyles()).toEqual(BLUE);
    expect(mockedDownload).not.toBeCalled();
    expect(chrome.tabs.query).not.toBeCalled();
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-2',
      localRevision: 'local-2',
      baseStyles: BLUE,
    });
  });

  it('downloads before pushing when the profile has no base yet', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1'),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedDownload.mockResolvedValue(GREEN);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-2'));

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(uploadedStyles()).toEqual({ ...BLUE, ...GREEN });
    expect(storedState()?.baseStyles).toEqual({ ...BLUE, ...GREEN });
  });

  it('pulls when only the remote changed, without pushing back', async () => {
    seed({ styles: RED, state: synced('remote-1', 'local-1', RED) });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(BLUE);

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(mockedWrite).not.toBeCalled();
    expect(storedStyles()).toEqual(BLUE);
    // Open tabs (and an open editor) must see the pulled styles right away,
    // or a stale editor pushes what it last saw over what was just pulled.
    expect(chrome.tabs.query).toBeCalledTimes(1);
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-2',
      baseStyles: BLUE,
    });
  });

  it('merges when both sides changed', async () => {
    seed({
      styles: { ...RED, ...GREEN },
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(BLUE);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(mockedWrite).toBeCalledTimes(1);
    expect(uploadedStyles()).toEqual({ ...BLUE, ...GREEN });
    expect(storedStyles()).toEqual({ ...BLUE, ...GREEN });
    expect(chrome.tabs.query).toBeCalledTimes(1);
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-3',
      baseStyles: { ...BLUE, ...GREEN },
      conflicts: [],
    });
  });

  it('carries a deletion made on another device over to local', async () => {
    seed({
      styles: { ...RED, ...GREEN },
      state: synced('remote-1', 'local-1', { ...RED, ...GREEN }),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(GREEN);

    await runGoogleDriveSync();

    expect(storedStyles()).toEqual(GREEN);
    expect(mockedWrite).not.toBeCalled();
  });

  it('carries a local deletion up to the remote instead of restoring it', async () => {
    seed({
      styles: GREEN,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', { ...RED, ...GREEN }),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedWrite.mockResolvedValue(remoteMetadata('remote-2'));

    await runGoogleDriveSync();

    expect(mockedDownload).not.toBeCalled();
    expect(uploadedStyles()).toEqual(GREEN);
    expect(storedStyles()).toEqual(GREEN);
  });

  it('records a conflict when both sides rewrote the same lines, keeping earlier ones', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED, {
        conflicts: [{ url: 'old.com', at: '2023-01-01T00:00:00.000Z' }],
      }),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue({
      'a.com': style('a { color: green; }', '2024-03-01T00:00:00.000Z'),
    });
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));

    await runGoogleDriveSync();

    expect(storedStyles()['a.com'].css).toContain('a { color: green; }');
    expect(storedStyles()['a.com'].css).toContain('a { color: blue; }');
    expect(storedState()?.conflicts?.map(conflict => conflict.url)).toEqual([
      'old.com',
      'a.com',
    ]);
  });

  it('writes nothing when neither side changed, and backfills the base', async () => {
    seed({ styles: RED, state: synced('remote-1', 'local-1') });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));

    await runGoogleDriveSync();

    expect(mockedWrite).not.toBeCalled();
    expect(mockedDownload).not.toBeCalled();
    expect(storedState()?.baseStyles).toEqual(RED);
  });

  // The bug this replaced: a pull stamped its own timestamp as the sync time
  // while setAll stamped styles-metadata a moment later, so the next run always
  // concluded local was newer and re-uploaded what it had just downloaded.
  it('does not push on the run after a pull', async () => {
    seed({ state: synced('remote-1', 'local-1', {}) });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(BLUE);

    await runGoogleDriveSync();
    expect(mockedWrite).not.toBeCalled();

    await runGoogleDriveSync();
    expect(mockedWrite).not.toBeCalled();
    expect(mockedDownload).toBeCalledTimes(1);
  });

  it('records the local revision read before the upload, not after', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
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

  it('starts over once when the remote moved while merging', async () => {
    seed({
      styles: { ...RED, ...GREEN },
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
    });

    // The search still answers remote-1 (the base, so no download), but by
    // the time the guard runs another device has written remote-2. The rerun
    // sees remote-2 up front and merges against the fresh download.
    mockedGetRemote
      .mockResolvedValueOnce(remoteMetadata('remote-1'))
      .mockResolvedValue(remoteMetadata('remote-2'));
    mockedGetFile.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(BLUE);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));

    await runGoogleDriveSync();

    expect(mockedDownload).toBeCalledTimes(1);
    expect(mockedWrite).toBeCalledTimes(1);
    expect(uploadedStyles()).toEqual({ ...BLUE, ...GREEN });
    expect(storedState()?.baseStyles).toEqual({ ...BLUE, ...GREEN });
  });

  it('starts over once when a style was saved while the merge ran', async () => {
    const PURPLE = {
      'a.com': style('a { color: purple; }', '2024-03-01T00:00:00.000Z'),
    };

    seed({
      styles: RED,
      localRevision: 'local-1',
      state: synced('remote-1', 'local-1', RED),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedGetFile.mockResolvedValue(remoteMetadata('remote-2'));
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));
    mockedDownload
      .mockImplementationOnce(async () => {
        // The user saves an edit while the download is in flight.
        store['styles'] = PURPLE;
        store['styles-metadata'] = { modifiedTime: 'local-2' };
        return BLUE;
      })
      .mockResolvedValue(BLUE);

    await runGoogleDriveSync();

    // The first merge (RED vs BLUE) was thrown away; the rerun merged the
    // edit against the remote instead of overwriting it.
    expect(mockedDownload).toBeCalledTimes(2);
    expect(storedStyles()['a.com'].css).toContain('a { color: purple; }');
    expect(uploadedStyles()['a.com'].css).toContain('a { color: purple; }');
    expect(storedState()?.conflicts?.map(conflict => conflict.url)).toEqual([
      'a.com',
    ]);
  });

  it('keeps a conflict dismissed while the run was in progress dismissed', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED, {
        conflicts: [{ url: 'old.com', at: '2024-01-01T00:00:00.000Z' }],
      }),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedGetFile.mockResolvedValue(remoteMetadata('remote-1'));
    mockedWrite.mockImplementation(async () => {
      // Dismissed from the Sync tab mid-upload.
      store[STATE_KEY] = { ...(store[STATE_KEY] as SyncState), conflicts: [] };
      return remoteMetadata('remote-2');
    });

    await runGoogleDriveSync();

    expect(storedState()?.conflicts).toEqual([]);
  });

  it('gives up for this run when the remote keeps moving', async () => {
    seed({
      styles: BLUE,
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-1'));
    mockedGetFile.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(RED);

    const response = await runGoogleDriveSync();

    expect(response).toMatchObject({ ok: false });
    expect(mockedWrite).not.toBeCalled();
    expect(storedState()).toMatchObject({ remoteRevision: 'remote-1' });
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

  it('flags that a sign-in is needed only when a scheduled run hits an auth failure', async () => {
    seed({ styles: RED });
    mockedGetRemote.mockRejectedValue(
      Object.assign(new Error('Token validation error'), { code: 'auth' })
    );

    await runGoogleDriveSync({ interactive: true });
    expect(store['google-drive-sync-needs-auth']).toBeUndefined();

    await runGoogleDriveSync({ interactive: false });
    expect(store['google-drive-sync-needs-auth']).toBe(true);

    mockedGetRemote.mockResolvedValue(null);
    mockedWrite.mockResolvedValue(remoteMetadata('remote-1'));

    await runGoogleDriveSync({ interactive: false });
    expect(store['google-drive-sync-needs-auth']).toBe(false);
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
      styles: { ...RED, ...GREEN },
      localRevision: 'local-2',
      state: synced('remote-1', 'local-1', RED),
    });

    mockedGetRemote.mockResolvedValue(remoteMetadata('remote-2'));
    mockedDownload.mockResolvedValue(BLUE);
    mockedWrite.mockRejectedValueOnce(new Error('upload failed'));

    const response = await runGoogleDriveSync();

    expect(response).toMatchObject({ ok: false });
    // The merge was written locally but never recorded as synced.
    expect(storedStyles()).toEqual({ ...BLUE, ...GREEN });
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-1',
      baseStyles: RED,
    });

    // Next run: local (the merge) differs from the base, the remote is what
    // was downloaded — so the merge simply pushes.
    mockedWrite.mockResolvedValue(remoteMetadata('remote-3'));

    await runGoogleDriveSync();

    expect(mockedWrite).toBeCalledTimes(2);
    expect(uploadedStyles(1)).toEqual({ ...BLUE, ...GREEN });
    expect(storedState()).toMatchObject({
      remoteRevision: 'remote-3',
      baseStyles: { ...BLUE, ...GREEN },
    });
  });
});
