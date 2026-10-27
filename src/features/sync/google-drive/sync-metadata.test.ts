import {
  clearSyncState,
  forgetSyncAccount,
  getSyncAccountEmail,
  getSyncIssue,
} from './sync-metadata';

const SYNC_STATE_KEY = 'google-drive-sync-state';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};
  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys: string | Array<string>) =>
          Object.fromEntries([keys].flat().map(key => [key, store[key]]))
        ),
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

describe('getSyncIssue', () => {
  beforeEach(() => {
    store['google-drive-sync-enabled'] = true;
  });

  it('reports nothing while sync works', async () => {
    await expect(getSyncIssue()).resolves.toBeNull();
  });

  it('reports nothing once sync is off', async () => {
    store['google-drive-sync-enabled'] = false;
    store['google-drive-sync-error'] = 'sync_error_parse';

    await expect(getSyncIssue()).resolves.toBeNull();
  });

  it('asks for a sign-in when a scheduled run could not get a token', async () => {
    store['google-drive-sync-needs-auth'] = true;

    await expect(getSyncIssue()).resolves.toBe('sign-in');
  });

  it('asks for a sign-in when Google turned the run down', async () => {
    store['google-drive-sync-error'] = 'sync_error_auth';

    await expect(getSyncIssue()).resolves.toBe('sign-in');
  });

  it('reports a failed run over a needed sign-in', async () => {
    store['google-drive-sync-needs-auth'] = true;
    store['google-drive-sync-error'] = 'sync_error_unknown';

    await expect(getSyncIssue()).resolves.toBe('error');
  });
});
