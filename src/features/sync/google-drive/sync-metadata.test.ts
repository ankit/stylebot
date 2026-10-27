import {
  clearSyncState,
  forgetSyncAccount,
  getSyncAccountEmail,
} from './sync-metadata';

const SYNC_STATE_KEY = 'google-drive-sync-state';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};
  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (keys: Array<string>) => {
          keys.forEach(key => delete store[key]);
        }),
      },
    },
  } as unknown as typeof chrome;
});

describe('getSyncAccountEmail', () => {
  it('reads the account the last sync ran as', async () => {
    store[SYNC_STATE_KEY] = { account: { email: 'me@example.com' } };

    await expect(getSyncAccountEmail()).resolves.toBe('me@example.com');
  });

  it('resolves nothing once disconnecting clears the sync state', async () => {
    store[SYNC_STATE_KEY] = { account: { email: 'me@example.com' } };

    await clearSyncState();

    await expect(getSyncAccountEmail()).resolves.toBeUndefined();
  });
});

describe('forgetSyncAccount', () => {
  it('drops the account and keeps the rest of the state', async () => {
    store[SYNC_STATE_KEY] = {
      lastSyncedAt: 'then',
      account: { email: 'me@example.com' },
    };

    await forgetSyncAccount();

    expect(store[SYNC_STATE_KEY]).toEqual({
      lastSyncedAt: 'then',
      account: undefined,
    });
  });

  it('writes nothing when no account is kept', async () => {
    await forgetSyncAccount();

    expect(chrome.storage.local.set).not.toBeCalled();
  });
});
