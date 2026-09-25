import type { SyncState } from '@stylebot/types';

import SyncStorageUpdate from '../sync-storage-update';

const STATE_KEY = 'google-drive-sync-state';
const DONE_KEY = 'migration_sync_storage_update_complete';

const legacyMetadata = {
  id: 'file-id',
  modifiedTime: '2024-01-01T00:00:00.000Z',
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
};

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: Array<string>) => {
          const items: Record<string, unknown> = {};
          keys.forEach(key => (items[key] = store[key]));
          return items;
        }),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('SyncStorageUpdate', () => {
  it('seeds the sync state from the metadata an earlier version stored', async () => {
    store['google-drive-sync'] = legacyMetadata;

    await SyncStorageUpdate();

    expect(store[STATE_KEY]).toEqual<SyncState>({
      metadata: legacyMetadata,
      remoteRevision: '2024-01-01T00:00:00.000Z',
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      localRevision: '',
    });
  });

  it('leaves localRevision empty so the first run merges rather than overwrites', async () => {
    store['google-drive-sync'] = legacyMetadata;

    await SyncStorageUpdate();

    expect((store[STATE_KEY] as SyncState).localRevision).toBe('');
  });

  it('marks itself done even when there is nothing to migrate', async () => {
    await SyncStorageUpdate();

    expect(store[DONE_KEY]).toBe(true);
    expect(store[STATE_KEY]).toBeUndefined();
  });

  it('does not run twice', async () => {
    store[DONE_KEY] = true;
    store['google-drive-sync'] = legacyMetadata;

    await SyncStorageUpdate();

    expect(store[STATE_KEY]).toBeUndefined();
  });

  it('never overwrites an existing sync state', async () => {
    const existing: SyncState = {
      metadata: legacyMetadata,
      remoteRevision: 'remote-9',
      localRevision: 'local-9',
      lastSyncedAt: '2024-06-01T00:00:00.000Z',
    };

    store[STATE_KEY] = existing;
    store['google-drive-sync'] = legacyMetadata;

    await SyncStorageUpdate();

    expect(store[STATE_KEY]).toBe(existing);
  });

  it('ignores legacy metadata that is missing an id', async () => {
    store['google-drive-sync'] = { modifiedTime: '2024-01-01T00:00:00.000Z' };

    await SyncStorageUpdate();

    expect(store[STATE_KEY]).toBeUndefined();
    expect(store[DONE_KEY]).toBe(true);
  });
});
